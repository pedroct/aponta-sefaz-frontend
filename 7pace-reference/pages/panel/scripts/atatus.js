function atatusInit(window, document, config, host, source) {
    const regex = /([a-zA-Z-\d]*)[.]\S*/;
    const matches = host.match(regex);
    const orgName = matches?.length > 1 ? matches[1] : "unknown";

    //AC: Default value is 1 day
    const samplingExpirySettings = config.samplingExpiryMin || 60 * 24;

    //AC: Time in milliseconds
    const samplingExpiryTime = samplingExpirySettings * 60 * 1000

    if (!config.sampleRate) {
        return;
    }

    const setWithExpiry = (key, value, ttl) => {
        const now = new Date()

        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        }
        localStorage.setItem(key, JSON.stringify(item))
    }

    const getWithExpiry = (key) => {
        const itemStr = localStorage.getItem(key)
        if (!itemStr) {
            return null
        }
        const item = JSON.parse(itemStr)
        const now = new Date()
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key)
            return null
        }
        return item.value
    }

    const atatusSampleRateStr = "AtatusSamplingDisabled-" + host + "-" + orgName;
    let stopProccessing = getWithExpiry(atatusSampleRateStr);
    if (stopProccessing == null) {
        const randomNumber = Math.floor(Math.random() * 100);
        stopProccessing = (randomNumber > config.sampleRate).toString();
        setWithExpiry(atatusSampleRateStr, stopProccessing, samplingExpiryTime);
    }
    if (stopProccessing == "true") {
        return
    }

    window._atatusConfig = config;
    if (window._atatusConfig.tags.indexOf(orgName) == -1) {
        window._atatusConfig.tags.push(orgName);
    }

    function _asyncAtatus(t) {
        var e = document.createElement("script");
        e.type = "text/javascript", e.async = !0, e.src = "https://dmc1acwvwny3.cloudfront.net/atatus.js";
        var n = document.getElementsByTagName("script")[0];
        e.addEventListener && e.addEventListener("load", (function(e) { t(null, e) }), !1), n.parentNode.insertBefore(e, n)
    }

    _asyncAtatus(function() {
        if (window.atatus) {
            window.atatus.setTags(window._atatusConfig.tags);

            window.atatus.onBeforeSend(function(payload) {
                if (payload) {
                    // For session
                    if (payload.data) {
                        payload.data = JSON.parse(JSON.stringify(payload.data).replaceAll(window.location.origin, config.customPageHost));
                    }
                    // For Ajax
                    if (payload.xhr) {
                        payload.xhr = JSON.parse(JSON.stringify(payload.xhr).replaceAll(window.location.origin, config.customPageHost));
                    }

                    // For routes
                    if (payload.slowestRoutes) {
                        payload.slowestRoutes = JSON.parse(JSON.stringify(payload.slowestRoutes).replaceAll(window.location.origin, config.customPageHost));
                    }

                    // For all
                    if (payload.request && payload.request.url) {
                        payload.request.url = config.customPageHost + "/" + source + "?host=" + host;
                    }

                    return true;
                }
            });
        }
    });
}
