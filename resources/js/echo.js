import Echo from "laravel-echo";

window.Echo = new Echo({
    broadcaster: "reverb",
    wsHost: window.location.hostname,
    wsPort: 8080,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
});
