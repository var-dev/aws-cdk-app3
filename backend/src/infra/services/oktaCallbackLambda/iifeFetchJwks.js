(function iifeFetchJwks() {
  const fetch2 = window.fetch;

  fetch2('https://' + oktaDomain + '/oauth2/v1/keys')
    .then(
      (res) => res.json(),
      (err) => { console.error('8eRg2V9aXz JWKS:', JSON.stringify(err, undefined, 2)); return err; }
    )
    .then((res) => {
      console.log('JWKS JSON:', JSON.stringify(res.keys, undefined, 2))
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(JSON.stringify(res.keys));
      // Convert Uint8Array to Base64
      const base64String = btoa(String.fromCharCode(...uint8Array));
      const base64UrlSafe = base64String.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
      return base64UrlSafe;
    })
    .then((res) => {
      setCookie('okta_jwks', res, 1);
      return res;
    })
    .then((res)=>{
      // HTTP redirect:
      window.location.replace("/okta/authorize");
    })
    .catch((err) => {
      console.error('8eRg2V9aXz' + err);
    })

  function setCookie(name, value, hours) {
    const d = new Date();
    d.setTime(d.getTime() + (hours * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/;Domain=" + appDomain + ";Secure;SameSite=Strict";
  }
})()