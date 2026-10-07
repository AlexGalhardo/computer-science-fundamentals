# Security labs

The security area is **defensive and educational**, in the spirit of OWASP Juice Shop and DVWA.

- Every lab (OWASP Top 10, XSS, SQL injection, CSP and so on) runs **only locally, in Docker, with no external network access**. Use an `internal: true` network in docker-compose and bind published ports to `127.0.0.1`.
- Every vulnerable example ships together with its **fixed version** and an **automated test** that fails against the vulnerable code and passes against the fix.
- Documentation explains **why** the flaw happens and **how to prevent it**. The exploit is only the minimum needed to make the flaw observable inside the lab.
- Not allowed: payloads aimed at real systems, evasion techniques (WAF, EDR, antivirus, detection bypass), and attack tools that are reusable outside the lab.
- Vulnerable code is clearly labelled as such in file names, comments and the README, and is never importable as a library by other mini-projects.
- No real credentials, tokens or personal data, even as examples. Use obviously fake values.
