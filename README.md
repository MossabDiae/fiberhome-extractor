# ⚡️ Fiberhome Extractor ⚡️
Extract PPPoE and VoIP credentials from Algeria Telecom's FiberHome modems

### Usage
- Login to admin interface at `192.168.1.1`

*Note: if you can't access via SuperAdmin, try the tool with default user account, `user/user1234`*
- Open dev tools > Console
- Paste the following:
```
import("https://cdn.jsdelivr.net/gh/MossabDiae/fiberhome-extractor@vv2_migration/main.js");
```
<!-- 
allow multi reloads during debug using:
import(`https://cdn.jsdelivr.net/gh/MossabDiae/fiberhome-extractor@vv2_migration/main.js?t=${Date.now()}`);
-->

- Press Enter
![result](img/results.png)

### Features
- Extract PPPoE credentials
- Extract VoIP credentials
- Unprivileged download of config file

### Known issues
- Some software versions lack full credentials extraction (e.g: RP4423)

### TODO
- Migrate to in-browser download and extraction of config
- Auto provide admin access
- Try to drop user login requirement
- Test and support more routers / sotfware version

### Acknowledgements
- Inspired by [Get Password PPPoE](https://gist.github.com/barrriwa/80d6433144e93c06ad3a5c361bf6422d) by @barrriwa