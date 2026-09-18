// Resolves hostnames that are DNS-poisoned / hijacked by local Indian ISPs (such as ACT Fibernet)
// intercepting port 53 UDP traffic and redirecting *.supabase.co to 106.51.113.17.
// By intercepting dns.lookup and asynchronously resolving directly to known-good Cloudflare edge
// IPs, Node.js processes (fetch, undici, @supabase/supabase-js, https) connect seamlessly to
// Supabase.
//
// More than one IP is listed deliberately. A single hardcoded address is a single point of
// failure — that edge node occasionally refused/timed out the connection, which surfaced as
// intermittent 500s ("TypeError: fetch failed") on otherwise-working routes. Handing back both
// addresses lets Node's connection-attempt fallback (Happy Eyeballs, on by default since Node 20)
// retry the second one when the first misbehaves, the same as a normal DNS answer with multiple
// A records would.

const dns = require("dns");

const SUPABASE_IPS = ["104.18.38.10", "172.64.149.246"];

const originalLookup = dns.lookup;

function installDnsBypass() {
  if (dns.__supabase_bypass_installed) return;
  dns.__supabase_bypass_installed = true;

  dns.lookup = function (hostname, options, callback) {
    console.log("[dns-bypass] lookup called for:", hostname, "OPTIONS:", options);
    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    if (typeof hostname === "string" && hostname.endsWith(".supabase.co")) {
      const res = options && options.all
        ? SUPABASE_IPS.map((address) => ({ address, family: 4 }))
        : SUPABASE_IPS[0];

      process.nextTick(() => {
        if (options && options.all) {
          callback(null, res);
        } else {
          callback(null, res, 4);
        }
      });
      return;
    }

    return originalLookup.call(dns, hostname, options, callback);
  };
}

installDnsBypass();

module.exports = { installDnsBypass, SUPABASE_IPS };
