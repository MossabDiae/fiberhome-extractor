$.ajax({
    url: '/js/aes.js',
    async: false,
    success: function (code) {
        eval(code);
    }
});

// Check for decryption method, if missing use a fallback that adds a note
if (typeof window.fhdecrypt !== "function") {
    console.warn("%cWarning: couldn't find decryption method (fhdecrypt) in the page context. Values will be shown as seen.", "color: #ffa500; font-weight: bold;");
    window.fhdecrypt = (val) => val + " (could not decrypt, missing decryption method)";
}

// Wrapper for fhdecrypt to handle empty/missing values
const _originalDecrypt = window.fhdecrypt;
window.fhdecrypt = (val) => {
    if (!val || val === "") return "not extracted";
    return _originalDecrypt(val);
};

// Support configurations
const SUPPORTED_MODELS = ['HG6145F1'];
const SUPPORTED_SOFTWARE = ['RP4421'];

// Initialize an object where extracted data is grouped
const extractedData = {
    "Device Info": [],
    "PPPoE creds": [],
    "Voip creds": []
};

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
// '/cgi-bin/ajax?ajaxmethod=get_base_info'
// '/cgi-bin/ajax?ajaxmethod=get_allwan_info'
// '/cgi-bin/ajax?ajaxmethod=get_voice_base_info'

// Extraction logic: Login User
const loginInfo = getJSON('/cgi-bin/ajax?ajaxmethod=get_login_user');
if (loginInfo && loginInfo.login_user) {
    let loggedInAs = "Unknown";
    loggedInAs = loginInfo.login_user === "2" ? "admin" : (loginInfo.login_user === "1" ? "user" : loginInfo.login_user);

    extractedData["Device Info"].push({
        Name: "User Info",
        "Logged in as": loggedInAs,
    });

}

// Extraction logic: Device Info
const deviceInfo = getJSON('/cgi-bin/ajax?ajaxmethod=get_base_info');
if (deviceInfo) {
    const modelNote = SUPPORTED_MODELS.includes(deviceInfo.ModelName) ? "" : " (not tested, extraction may not work)";
    const softwareNote = SUPPORTED_SOFTWARE.includes(deviceInfo.SoftwareVersion) ? "" : " (not tested, extraction may not work)";

    extractedData["Device Info"].push({
        Name: "Unit Information",
        "Model Name": `${deviceInfo.ModelName}${modelNote}`,
        "Software Version": `${deviceInfo.SoftwareVersion}${softwareNote}`,
    });
}

// Extraction logic: WAN (PPPoE)
const wanData = getJSON('/cgi-bin/ajax?ajaxmethod=get_allwan_info');
if (wanData && wanData.wan) {
    wanData.wan.forEach(item => {
        extractedData["PPPoE creds"].push({
            Name: item.Name,
            Username: item.Username,
            Password: fhdecrypt(item.Password),
            "Vlan ID": item.vlanid
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
    console.log("%c--- ⚡️ Fiberhome Extractor ⚡️ ---", "color: #00ff00; font-weight: bold; font-size: 1.2em;");

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
// Download config function
function downloadConfig() {
    window.location = "../cgi-bin/download?usrconfig_conf";
}

// GUI Popup implementation
function showPopup(data) {
    const modalId = "fh-extractor-modal";
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = modalId;
    Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "2147483647",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backdropFilter: "blur(4px)"
    });

    const modal = document.createElement("div");
    Object.assign(modal.style, {
        backgroundColor: "#1a1a1a",
        color: "#e0e0e0",
        width: "90%",
        maxWidth: "650px",
        maxHeight: "85%",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        border: "1px solid #333",
        animation: "fhFadeIn 0.3s ease-out"
    });

    // Add styles
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes fhFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        #fh-content-area::-webkit-scrollbar { width: 8px; }
        #fh-content-area::-webkit-scrollbar-track { background: #121212; border-radius: 4px; }
        #fh-content-area::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        #fh-content-area::-webkit-scrollbar-thumb:hover { background: #444; }
    `;
    document.head.appendChild(style);

    const header = document.createElement("div");
    header.style.marginBottom = "20px";
    header.innerHTML = `<h2 style="margin:0; color:#00ff00; font-size:24px;">⚡️ Fiberhome Extractor ⚡️</h2>`;
    modal.appendChild(header);

    const contentArea = document.createElement("div");
    contentArea.id = "fh-content-area";
    Object.assign(contentArea.style, {
        flex: "1",
        overflowY: "auto",
        marginBottom: "24px",
        padding: "16px",
        backgroundColor: "#0d0d0d",
        borderRadius: "12px",
        fontSize: "14px",
        lineHeight: "1.6",
        border: "1px solid #222"
    });

    let rawText = "--- FIBERHOME EXTRACTION RESULTS ---\n\n";
    for (const [group, items] of Object.entries(data)) {
        if (items.length === 0) continue;

        rawText += `[ ${group} ]\n`;
        const groupSec = document.createElement("div");
        groupSec.style.marginBottom = "25px";
        groupSec.innerHTML = `<h3 style="color:#00acee; border-bottom:1px solid #333; padding-bottom:8px; margin-top:0;">${group}</h3>`;

        items.forEach((item, index) => {
            const block = document.createElement("div");
            block.style.marginBottom = "15px";
            block.innerHTML = `<div style="color:#ffcc00; font-weight:600;">${item.Name}</div>`;
            rawText += `${index + 1}. ${item.Name}\n`;

            const list = document.createElement("div");
            list.style.paddingLeft = "12px";
            list.style.borderLeft = "2px solid #222";

            for (const [key, value] of Object.entries(item)) {
                if (key === "Name") continue;
                rawText += `   ${key}: ${value}\n`;
                const row = document.createElement("div");
                row.style.fontSize = "13px";
                row.innerHTML = `<span style="color:#888; width:140px; display:inline-block;">${key}:</span> <span style="color:#fff;">${value}</span>`;
                list.appendChild(row);
            }
            rawText += "\n";
            block.appendChild(list);
            groupSec.appendChild(block);
        });
        contentArea.appendChild(groupSec);
    }
    modal.appendChild(contentArea);

    const footer = document.createElement("div");
    Object.assign(footer.style, { display: "flex", justifyContent: "flex-end", gap: "12px" });

    const copyBtn = document.createElement("button");
    copyBtn.innerText = "Copy to Clipboard";
    Object.assign(copyBtn.style, { padding: "10px 20px", backgroundColor: "#00acee", border: "none", borderRadius: "8px", color: "white", cursor: "pointer", fontWeight: "600" });
    copyBtn.onclick = () => {
        const textarea = document.createElement("textarea");
        textarea.value = rawText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copyBtn.innerText = "✓ Copied!";
        setTimeout(() => copyBtn.innerText = "Copy to Clipboard", 2000);
    };

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Close";
    Object.assign(closeBtn.style, { padding: "10px 20px", backgroundColor: "#333", border: "none", borderRadius: "8px", color: "white", cursor: "pointer", fontWeight: "600" });
    closeBtn.onclick = () => overlay.remove();

    const extractBtn = document.createElement("button");
    extractBtn.innerText = "Extract Config";
    Object.assign(extractBtn.style, { padding: "10px 20px", backgroundColor: "#333", border: "1px solid #444", borderRadius: "8px", color: "white", cursor: "pointer", fontWeight: "600" });
    extractBtn.onclick = () => downloadConfig();

    footer.appendChild(extractBtn);
    footer.appendChild(copyBtn);
    footer.appendChild(closeBtn);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Display results
printResults(extractedData);
showPopup(extractedData);