const express = require("express");
const router = express.Router({ mergeParams: true }); // eslint-disable-line
const env = require("../config/env");
const authTokenSecret = env.nconf.get("site:authTokenSecret");
const jwt = require("jsonwebtoken");
const { getFullList, update } = require("./utils/google_client");
const { requireValidSessionOrToken } = require("./utils/middleware");
const sendSMS = require("./utils/smsapi_client").send;
const FROM = "4741238002";
const baseUrl = env.nconf.get("site:baseUrl");

router.get("/login", (req, res, next) => {
  if (!req.query.token) {
    res.status(401);
    throw new Error("not allowed");
  }
  let payload;
  try {
    payload = jwt.verify(req.query.token, authTokenSecret);
  } catch (err) {
    res.status(401);
    throw new Error("not allowed");
  }
  if (payload && payload.loppislogin) {
    let token = jwt.sign({ admin: true }, authTokenSecret, {
      expiresIn: "14 days",
    });
    res.cookie("adminJwt", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 14,
      path: "/",
    });
    // something about Express or Safari not accepting a cookie during a redirect..?
    res.send(`<html><meta http-equiv="refresh" content="1; url=${
      payload.url || "/"
    }" />
		<p>
		Du er nå logget inn og sendes videre til <a href="${
      payload.url || "/"
    }">Loppis-admin</a>
		</p>
		</html>`);
    res.end();
    return;
  }
  res.status(401);
  next(new Error("not allowed"));
});
// Note that /prefs is available without authentication
// The Google maps token is not very secret, but don't
// add anything private or important here..
router.get("/prefs", (req, res, next) => {
  const prefs = {
    cols: env.cols,
    types: env.nconf.get("types"),
  };
  if (env.nconf.get("google:mapsToken")) {
    prefs.googleMapsToken = env.nconf.get("google:mapsToken");
  }
  res.json(prefs);
});

// Request session is also available withouth auth (d'oh)
// This simply sends admin an SMS with a request
// (Would be nice to have a Styreportalen API..again!)
// Let's hope this won't be abused..

router.post("/letmein", (req, res, next) => {
  let phone = req.body.phone.trim().replace(/^\+/, "");
  phone = /47\d{8}/.test(phone) ? phone : `47${phone}`;
  if (phone.length < 10 || !/^47[49]/.test(phone)) {
    return next(new Error("Krever gyldig mobilnummer"));
  }
  return sendSMS(
    phone,
    FROM,
    `Ber om tilgang til loppisadmin: +${phone}

${baseUrl}/api/login?token=${jwt.sign(
      {
        loppislogin: true,
        url: `/api/sendadminlink?to=${encodeURIComponent(phone)}`,
      },
      authTokenSecret,
      { expiresIn: "1 days" }
    )}
		`
  ).then(() => {
    res.send(
      'Forespørsel sendt, du mottar etterhvert lenke på SMS... <a href="/">Tilbake</a>'
    );
  });
});

// Require valid session for all end points defined below
router.use(requireValidSessionOrToken);

router.get("/helpertoken", (req, res, next) => {
  let token = jwt.sign({ helper: true }, authTokenSecret, {
    expiresIn: "3 days",
  });
  res.json({ token });
});

router.get("/sendadminlink", (req, res, next) => {
  let token = jwt.sign({ loppislogin: true }, authTokenSecret, {
    expiresIn: "14 days",
  });
  const msg = `Innloggingslenke, gyldig i 14 dager:
${baseUrl}/api/login?token=${token}`;
  return sendSMS(req.query.to, FROM, msg).then(() => {
    res.send("Lenke sendt...  <a href=\"/\">Videre til admin</a>");
  });
});

router.get("/jobs", (req, res, next) => {
  return getFullList(Boolean(req.query.refresh))
    .then((result) => res.json(result))
    .catch(next);
});

// /job/:jobnrs endpoint supports fetching one single row ID - or multiple, comma-separated ones
router.get("/job/:jobnrs", (req, res, next) => {
  if (!req.params.jobnrs) {
    res.status(401);
    throw new Error("not allowed");
  }
  return getFullList(false).then((result) => {
    let jobnrs = req.params.jobnrs.split(/,/g);
    result = result.filter((row) => {
      return jobnrs.includes(row[env.cols.JOBNR]);
    });
    res.json(result);
  });
});

router.get("/byperson/:assignee", (req, res, next) => {
  if (!req.params.assignee) {
    res.status(401);
    throw new Error("not allowed");
  }
  return getFullList(false)
    .then((result) => {
      result = result.filter((item) => {
        return item[env.cols.ASSIGNEE] === req.params.assignee;
      });
      res.json(result);
    })
    .catch(next);
});

router.post("/update/:jobnr", (req, res, next) => {
  return update(req.params.jobnr, req.body.details)
    .then((result) => {
      res.json(result);
    })
    .catch(next);
});

router.post("/sendsms", (req, res, next) => {
  if (!(req.body.to && req.body.from && req.body.message)) {
    res.status("401");
    res.end();
    return;
  }
  return sendSMS(req.body.to, req.body.from, req.body.message, req.body.param1)
    .then((result) => {
      res.json(result);
    })
    .catch(next);
});

module.exports = router;
