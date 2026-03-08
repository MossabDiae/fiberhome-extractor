// Initialize an object where extracted data is grouped
const extractedData = {
    "PPPoE creds": [],
    "Voip creds": []
};

// getting the decryption function (used for some values extraction)
// from window context
window.fhdecrypt = fhdecrypt;

// abstraction to get json from url
function getJSON(url) {
    let result = null;

    $.ajax({
        url: url,
        async: false,
        success: (response) => {
            try {
                result = typeof response === "string" ? JSON.parse(response) : response;
            } catch (e) {
                result = null;
            }
        }
    });

    return result;
}

// ENDPONTS
// '/cgi-bin/ajax?ajaxmethod=get_allwan_info'
// '/cgi-bin/ajax?ajaxmethod=get_voice_base_info'

// Extraction logic: WAN (PPPoE)
const wanData = getJSON('/cgi-bin/ajax?ajaxmethod=get_allwan_info');
if (wanData && wanData.wan) {
    wanData.wan.forEach(item => {
        extractedData["PPPoE creds"].push({
            Name: item.Name,
            Username: item.Username,
            Password: fhdecrypt(item.Password)
        });
    });
}

// Extraction logic: VoIP
const voipResponse = getJSON('/cgi-bin/ajax?ajaxmethod=get_voice_base_info');
if (voipResponse && voipResponse.voice_base) {
    const voipData = voipResponse.voice_base;
    extractedData["Voip creds"].push({
        Name: "VoIP Settings",
        "VoIP Username": fhdecrypt(voipData.AuthUserName1),
        "VoIP Password": fhdecrypt(voipData.AuthPassword1),
        "Telephone Number": fhdecrypt(voipData.DirectoryNumber1),
        "Proxy Server": voipData.ProxyServer,
        "Proxy Server Port": voipData.ProxyServerPort,
        "Register Server": voipData.RegistrarServer,
        "Register Server Port": voipData.RegistrarServerPort
    });
}

// Beautiful print function
function printResults(data) {
    console.log("%c--- Extraction Results ---", "color: #00ff00; font-weight: bold; font-size: 1.2em;");

    for (const [group, items] of Object.entries(data)) {
        if (items.length === 0) continue;

        console.log(`%c${group}`, "color: #00acee; font-weight: bold; text-decoration: underline; margin-top: 10px;");

        items.forEach((item, index) => {
            console.log(`%c[${index + 1}] ${item.Name}`, "color: #ffcc00; font-style: italic;");
            for (const [key, value] of Object.entries(item)) {
                if (key === "Name") continue;
                console.log(`  %c${key}:%c ${value}`, "color: #ffffff; font-weight: bold;", "color: #cccccc;");
            }
        });
    }
}

// Display results
printResults(extractedData);