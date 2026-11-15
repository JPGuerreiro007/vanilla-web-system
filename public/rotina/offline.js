/* Single app-shell registrar. Never cache or register in editor previews. */
(function () {
  "use strict";
  function refused() {
    var host = window.location.hostname.toLowerCase();
    var labels = host.split(".");
    var lovableDomain = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host);
    return window.self !== window.top || host === "localhost" || host === "127.0.0.1" ||
      (lovableDomain && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(labels[0]) || /^project--.+-dev$/.test(labels[0]))) ||
      /(^|\.)(lovableproject\.com|lovableproject-dev\.com|beta\.lovable\.dev)$/.test(host) ||
      new URLSearchParams(window.location.search).get("sw") === "off";
  }
  async function register() {
    if (!("serviceWorker" in navigator)) return;
    try {
      var workerURL = new URL("sw.js", window.location.href).href;
      if (refused()) {
        var registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.filter(function (registration) {
          return [registration.active, registration.waiting, registration.installing].some(function (worker) {
            return worker && worker.scriptURL === workerURL;
          });
        }).map(function (registration) { return registration.unregister(); }));
        return;
      }
      var registration = await navigator.serviceWorker.register(workerURL, { scope: "./" });
      // Generated Workbox worker skips waiting and claims clients for automatic updates.
      registration.update().catch(function () {});
    } catch (error) {
      // Storage restrictions or unavailable networks must not prevent normal app use.
      console.warn("Não foi possível ativar o modo offline.");
    }
  }
  window.RotinaOffline = { register: register };
})();
