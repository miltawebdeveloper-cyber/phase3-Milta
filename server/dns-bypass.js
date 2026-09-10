// Resolves hostnames that are DNS-poisoned / hijacked by local Indian ISPs (such as ACT Fibernet)
// intercepting port 53 UDP traffic and redirecting *.supabase.co to 106.51.113.17.
// By intercepting dns.lookup and asynchronously resolving directly to Cloudflare edge IP 104.18.38.10,
// Node.js processes (fetch, undici, @supabase/supabase-js, https) connect seamlessly to Supabase.

const dns = require("dns");

const SUPABASE_IP = "104.18.38.10";

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
        ? [{ address: SUPABASE_IP, family: 4 }]
        : SUPABASE_IP;

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

module.exports = { installDnsBypass, SUPABASE_IP };
