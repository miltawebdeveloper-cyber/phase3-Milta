require("./dns-bypass");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars in server");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Multer for memory storage (file handling for application resumes)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// CMS admin API. Kept in its own module because it is the only part of this
// server that uses the service role key and requires authentication — mixing it
// into the public form handlers above would make that boundary easy to lose.
const adminRouter = require("./admin");
app.use("/api/admin", adminRouter);

// Content Update API (state/city document workflow). Same auth gate.
app.use("/api/content", require("./content"));

// Same gate the admin router uses, reused for the one write path that lives
// outside it. Defined here so it is impossible to add that route without it.
const { requireAdmin } = adminRouter;

// Both values may hold a comma-separated list, so split either one.
const parseRecipients = (recipientsValue, fallbackEmail, fallbackName) => {
  const source = recipientsValue || fallbackEmail;
  if (!source) return [];

  return source
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => ({ email: entry, name: fallbackName || "Team" }));
};

const sendBrevoTemplateEmail = async ({ templateId, params, recipients, replyTo, senderName }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey || !templateId || !recipients.length) {
    return {
      success: false,
      message: "Brevo email skipped because BREVO_API_KEY, templateId, or recipients are missing.",
    };
  }

  const payload = {
    to: recipients,
    templateId,
    params,
  };

  if (replyTo && replyTo.email) {
    payload.replyTo = replyTo;
  }

  // Use a verified sender email, but display the applicant's name in the inbox
  let verifiedSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_TO_EMAIL;
  if (verifiedSenderEmail) {
    // Ensure we only use a single email for the sender, in case a comma-separated list was provided
    verifiedSenderEmail = verifiedSenderEmail.split(',')[0].trim();
    
    payload.sender = {
      email: verifiedSenderEmail,
      name: senderName || process.env.BREVO_SENDER_NAME || "Milta Website",
    };
  }

  const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!brevoResponse.ok) {
    const errorText = await brevoResponse.text();
    throw new Error(`Brevo API Error: ${brevoResponse.status} ${errorText}`);
  }

  const result = await brevoResponse.json().catch(() => ({}));

  return {
    success: true,
    message: "Brevo email notification sent successfully.",
    result,
  };
};

const jobRecipients = () =>
  parseRecipients(
    process.env.BREVO_JOB_TO_EMAILS || process.env.BREVO_NOTIFICATION_TO_EMAILS,
    process.env.BREVO_TO_EMAIL,
    process.env.BREVO_TO_NAME || "HR Team"
  );

const contactRecipients = () =>
  parseRecipients(
    process.env.BREVO_CONTACT_TO_EMAILS || process.env.BREVO_NOTIFICATION_TO_EMAILS,
    process.env.BREVO_TO_EMAIL,
    process.env.BREVO_CONTACT_TO_NAME || "Team"
  );

const newsletterRecipients = () =>
  parseRecipients(
    process.env.BREVO_NEWSLETTER_TO_EMAILS || process.env.BREVO_NOTIFICATION_TO_EMAILS,
    process.env.BREVO_TO_EMAIL,
    process.env.BREVO_NEWSLETTER_TO_NAME || "Team"
  );

/* =========================================
   1. BLOG ENDPOINTS
   ========================================= */

// `table` arrives from the client on every blog route (the site has a US
// `blogs` table and a UK `blogs_uk` one). It is chosen from a fixed allowlist
// rather than trusted: the reads below run with the anon key, but a caller
// should still never be able to aim these endpoints at an arbitrary table.
const BLOG_TABLES = new Set(["blogs", "blogs_uk"]);

const resolveBlogTable = (table) => {
  const name = table || "blogs";
  return BLOG_TABLES.has(name) ? name : null;
};

// Get Blogs (with filtering, ordering, limit options)
app.get("/api/blogs", async (req, res) => {
  try {
    const { featured, editors_pick, limit, order, ascending, table } = req.query;
    const tableName = resolveBlogTable(table);
    if (!tableName) {
      return res.status(400).json({ error: `Unknown table "${table}".` });
    }

    let query = supabase.from(tableName).select("*");

    if (featured === "true") {
      query = query.eq("featured", true);
    }
    if (editors_pick === "true") {
      query = query.eq("editors_pick", true);
    }

    if (order) {
      const isAsc = ascending === "true";
      query = query.order(order, { ascending: isAsc });
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("GET /api/blogs error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Single Blog by slug
app.get("/api/blogs/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { table } = req.query;
    const tableName = resolveBlogTable(table);
    if (!tableName) {
      return res.status(400).json({ error: `Unknown table "${table}".` });
    }

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Blog not found" });

    // Latest posts for the sidebar come from the same table as the post, so a
    // UK post lists UK posts and links to /uk/blogs/<uk-slug> — not US ones.
    const { data: latest, error: latestErr } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (latestErr) throw latestErr;

    res.json({ blog: data, latestPosts: latest || [] });
  } catch (error) {
    console.error(`GET /api/blogs/${req.params.slug} error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Update Blog Content (Admin)
//
// Requires an admin bearer token. Before this gate existed the route was open to
// the internet: the anon key it writes with is compiled into the public browser
// bundle, there was no auth of any kind, and `table` was taken straight from the
// request body — so any caller could rewrite any row in any table the anon key
// could reach. Nothing in the app called it, which is the only reason that was
// never exploited.
//
// `table` is chosen from the BLOG_TABLES allowlist (defined above) rather than
// trusted, so a bad or malicious value can only ever select one of the two blog
// tables.
app.post("/api/blogs/:id/update", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, table } = req.body || {};

    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string." });
    }
    const tableName = resolveBlogTable(table);
    if (!tableName) {
      return res.status(400).json({ error: `Unknown table "${table}".` });
    }

    const { data, error } = await supabase
      .from(tableName)
      .update({ content })
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error(`POST /api/blogs/${req.params.id}/update error:`, error);
    res.status(500).json({ error: error.message });
  }
});

/* =========================================
   1b. CMS PAGE ENDPOINTS (public reads)

   The browser talks to these instead of Supabase directly — some networks
   filter *.supabase.co at the TLS/SNI layer, which left CMS service pages and
   the areas-we-serve listing blank. RLS still applies: the anon key used here
   sees published rows only.
   ========================================= */

// One published CMS page by URL. Trailing slashes are inconsistent in the
// stored canonicals, so match both forms.
app.get("/api/pages/by-url", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "url is required" });

    const bare = String(url).replace(/\/+$/, "");
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .in("url", [`${bare}/`, bare])
      .eq("status", "published")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json(data ?? null);
  } catch (error) {
    console.error("GET /api/pages/by-url error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Every published state-service page, for the "areas we serve" listing. Paged
// at 1000 because PostgREST caps a response there by default.
app.get("/api/pages/state-service-links", async (_req, res) => {
  try {
    const out = [];
    const SIZE = 1000;
    for (let from = 0; ; from += SIZE) {
      const { data, error } = await supabase
        .from("pages")
        .select("state,service,url,meta_title")
        .eq("status", "published")
        .eq("kind", "service_state")
        .not("state", "is", null)
        .order("state")
        .range(from, from + SIZE - 1);

      if (error) throw error;
      out.push(...(data || []));
      if (!data || data.length < SIZE) break;
    }
    res.json(out);
  } catch (error) {
    console.error("GET /api/pages/state-service-links error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Published page URLs, optionally filtered by kind. Used by sitemap / tooling.
app.get("/api/pages/urls", async (req, res) => {
  try {
    const { kind, limit } = req.query;
    let query = supabase.from("pages").select("url").eq("status", "published");
    if (kind) query = query.eq("kind", kind);

    const { data, error } = await query.limit(limit ? parseInt(limit, 10) : 50000);
    if (error) throw error;
    res.json((data || []).map((r) => r.url));
  } catch (error) {
    console.error("GET /api/pages/urls error:", error);
    res.status(500).json({ error: error.message });
  }
});

// State descriptions for the areas-we-serve listing. The `states` table is
// optional (arrives with db/002) — if it isn't there yet, return {} so the page
// falls back to its hand-written copy instead of blanking.
app.get("/api/states/descriptions", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("states")
      .select("name,slug,description")
      .eq("status", "active");

    if (error) throw error;

    const out = {};
    for (const row of data || []) {
      if (row.description) {
        out[row.slug || String(row.name).replace(/\s+/g, "").toLowerCase()] = row.description;
      }
    }
    res.json(out);
  } catch (error) {
    console.warn("GET /api/states/descriptions (optional table):", error.message);
    res.json({});
  }
});

/* =========================================
   2. CONTACT FORM ENDPOINT
   ========================================= */

app.post("/api/contact", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      companyName,
      email,
      phoneNumber,
      howDidYouFind,
      serviceInterest,
      message,
    } = req.body;

    let emailNotification;

    try {
      const senderFullName = `${firstName || ""} ${lastName || ""}`.trim() || "User";
      emailNotification = await sendBrevoTemplateEmail({
        templateId: Number(process.env.BREVO_CONTACT_TEMPLATE_ID),
        recipients: contactRecipients(),
        replyTo: email ? { email, name: senderFullName } : undefined,
        senderName: `${senderFullName} (Contact Form)`,
        params: {
          form_type: "contact",
          first_name: firstName || "",
          last_name: lastName || "",
          company_name: companyName || "",
          email: email || "",
          phone_number: phoneNumber || "",
          how_did_you_find: howDidYouFind || "",
          service_interest: serviceInterest || "",
          message: message || "",
        },
      });
    } catch (emailError) {
      console.error("Brevo contact email send error:", emailError);
      emailNotification = {
        success: false,
        message: "Brevo email notification failed.",
        error: emailError.message,
      };
    }

    // Email is the only record of this submission, so a failed send must not
    // report success — the visitor would think we received the enquiry.
    if (!emailNotification.success) {
      return res.status(500).json({
        error: "Could not deliver your message. Please try again.",
        emailNotification,
      });
    }

    res.json({ success: true, emailNotification });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/newsletter", async (req, res) => {
  try {
    const { email } = req.body;

    let emailNotification;

    try {
      emailNotification = await sendBrevoTemplateEmail({
        templateId: Number(process.env.BREVO_NEWSLETTER_TEMPLATE_ID),
        recipients: newsletterRecipients(),
        senderName: "New Newsletter Subscriber",
        params: {
          form_type: "newsletter",
          email: email || "",
          subscriber_email: email || "",
        },
      });
    } catch (emailError) {
      console.error("Brevo newsletter email send error:", emailError);
      emailNotification = {
        success: false,
        message: "Brevo email notification failed.",
        error: emailError.message,
      };
    }

    if (!emailNotification.success) {
      return res.status(500).json({
        error: "Could not complete your subscription. Please try again.",
        emailNotification,
      });
    }

    res.json({ success: true, emailNotification });
  } catch (error) {
    console.error("POST /api/newsletter error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/* =========================================
   3. JOB APPLICATION ENDPOINT
   ========================================= */

app.post("/api/apply", upload.single("resume"), async (req, res) => {
  try {
    const { firstName, phone, jobType, position, email, reference } = req.body;
    const file = req.file;

    let resumeURL = "Resume not uploaded";

    if (file) {
      // Create a unique file name
      const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, ""); // sanitize
      const fileName = `resume_${Date.now()}_${originalName}`;

      // Upload to Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
        return res.status(500).json({ error: `Storage Error: ${uploadError.message}` });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      resumeURL = publicUrlData.publicUrl;
    }

    const brevoParams = {
      form_type: "job application",
      firstName: firstName || "",
      email: email || "",
      phone: phone || "",
      jobType: jobType || "",
      position: position || "",
      reference: reference || "",
      resumeURL,
    };

    let emailNotification;

    try {
      emailNotification = await sendBrevoTemplateEmail({
        templateId: Number(process.env.BREVO_JOB_TEMPLATE_ID),
        recipients: jobRecipients(),
        replyTo: email ? { email, name: firstName || "Applicant" } : undefined,
        senderName: firstName ? `${firstName} (Job Application)` : "New Job Application",
        params: brevoParams,
      });
    } catch (emailError) {
      console.error("Brevo email send error:", emailError);
      emailNotification = {
        success: false,
        message: "Brevo email notification failed.",
        error: emailError.message,
      };
    }

    // The resume survives in storage, but nobody is notified — treat as a failure.
    if (!emailNotification.success) {
      return res.status(500).json({
        error: "Could not submit your application. Please try again.",
        resumeURL,
        emailNotification,
      });
    }

    res.json({ success: true, resumeURL, emailNotification });
  } catch (error) {
    console.error("POST /api/apply critical error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/* =========================================
   STATIC FRONTEND (single-service deploy)
   =========================================
   When the frontend and backend are deployed as one Render service, the built
   React app lives in ../dist (relative to this file in server/). Express serves
   those files for every non-API request so React Router handles client-side
   navigation. The /api routes above are matched first, so the API is unaffected.
   ========================================= */

const path = require("path");
const fs = require("fs");

const distPath = path.join(__dirname, "..", "dist");

if (fs.existsSync(distPath)) {
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(distPath));

  // SPA fallback — any route not matched above returns index.html so
  // React Router can handle it client-side.
  // Note: Express 5 dropped the bare '*' wildcard — use a regex instead.
  app.get(/(.*)/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  console.log(`Serving static frontend from ${distPath}`);
} else {
  console.log("No dist/ folder found — running in API-only mode.");
}

/* =========================================
   SERVER START
   ========================================= */

require("./services/pageService").listStates("state")
  .then(s => console.log("SERVER STARTUP TEST: pageService states:", s.length))
  .catch(e => {
    console.error("SERVER STARTUP TEST FAILED MESSAGE:", e.message);
    console.error("SERVER STARTUP TEST FAILED DETAILS:", e);
  });

app.listen(port, () => {
  console.log(`Backend Express Server running on port ${port}`);
});
