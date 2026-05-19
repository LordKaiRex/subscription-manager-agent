"use strict";
var CircleW3s = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/safe-buffer/index.js
  var require_safe_buffer = __commonJS({
    "node_modules/safe-buffer/index.js"(exports, module) {
      var buffer = __require("buffer");
      var Buffer2 = buffer.Buffer;
      function copyProps(src, dst) {
        for (var key in src) {
          dst[key] = src[key];
        }
      }
      if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
        module.exports = buffer;
      } else {
        copyProps(buffer, exports);
        exports.Buffer = SafeBuffer;
      }
      function SafeBuffer(arg, encodingOrOffset, length) {
        return Buffer2(arg, encodingOrOffset, length);
      }
      SafeBuffer.prototype = Object.create(Buffer2.prototype);
      copyProps(Buffer2, SafeBuffer);
      SafeBuffer.from = function(arg, encodingOrOffset, length) {
        if (typeof arg === "number") {
          throw new TypeError("Argument must not be a number");
        }
        return Buffer2(arg, encodingOrOffset, length);
      };
      SafeBuffer.alloc = function(size, fill, encoding) {
        if (typeof size !== "number") {
          throw new TypeError("Argument must be a number");
        }
        var buf = Buffer2(size);
        if (fill !== void 0) {
          if (typeof encoding === "string") {
            buf.fill(fill, encoding);
          } else {
            buf.fill(fill);
          }
        } else {
          buf.fill(0);
        }
        return buf;
      };
      SafeBuffer.allocUnsafe = function(size) {
        if (typeof size !== "number") {
          throw new TypeError("Argument must be a number");
        }
        return Buffer2(size);
      };
      SafeBuffer.allocUnsafeSlow = function(size) {
        if (typeof size !== "number") {
          throw new TypeError("Argument must be a number");
        }
        return buffer.SlowBuffer(size);
      };
    }
  });

  // node_modules/jws/lib/data-stream.js
  var require_data_stream = __commonJS({
    "node_modules/jws/lib/data-stream.js"(exports, module) {
      var Buffer2 = require_safe_buffer().Buffer;
      var Stream = __require("stream");
      var util = __require("util");
      function DataStream(data) {
        this.buffer = null;
        this.writable = true;
        this.readable = true;
        if (!data) {
          this.buffer = Buffer2.alloc(0);
          return this;
        }
        if (typeof data.pipe === "function") {
          this.buffer = Buffer2.alloc(0);
          data.pipe(this);
          return this;
        }
        if (data.length || typeof data === "object") {
          this.buffer = data;
          this.writable = false;
          process.nextTick(function() {
            this.emit("end", data);
            this.readable = false;
            this.emit("close");
          }.bind(this));
          return this;
        }
        throw new TypeError("Unexpected data type (" + typeof data + ")");
      }
      util.inherits(DataStream, Stream);
      DataStream.prototype.write = function write(data) {
        this.buffer = Buffer2.concat([this.buffer, Buffer2.from(data)]);
        this.emit("data", data);
      };
      DataStream.prototype.end = function end(data) {
        if (data)
          this.write(data);
        this.emit("end", data);
        this.emit("close");
        this.writable = false;
        this.readable = false;
      };
      module.exports = DataStream;
    }
  });

  // node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
  var require_param_bytes_for_alg = __commonJS({
    "node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js"(exports, module) {
      "use strict";
      function getParamSize(keySize) {
        var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
        return result;
      }
      var paramBytesForAlg = {
        ES256: getParamSize(256),
        ES384: getParamSize(384),
        ES512: getParamSize(521)
      };
      function getParamBytesForAlg(alg) {
        var paramBytes = paramBytesForAlg[alg];
        if (paramBytes) {
          return paramBytes;
        }
        throw new Error('Unknown algorithm "' + alg + '"');
      }
      module.exports = getParamBytesForAlg;
    }
  });

  // node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
  var require_ecdsa_sig_formatter = __commonJS({
    "node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js"(exports, module) {
      "use strict";
      var Buffer2 = require_safe_buffer().Buffer;
      var getParamBytesForAlg = require_param_bytes_for_alg();
      var MAX_OCTET = 128;
      var CLASS_UNIVERSAL = 0;
      var PRIMITIVE_BIT = 32;
      var TAG_SEQ = 16;
      var TAG_INT = 2;
      var ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6;
      var ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
      function base64Url(base64) {
        return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      }
      function signatureAsBuffer(signature) {
        if (Buffer2.isBuffer(signature)) {
          return signature;
        } else if ("string" === typeof signature) {
          return Buffer2.from(signature, "base64");
        }
        throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
      }
      function derToJose(signature, alg) {
        signature = signatureAsBuffer(signature);
        var paramBytes = getParamBytesForAlg(alg);
        var maxEncodedParamLength = paramBytes + 1;
        var inputLength = signature.length;
        var offset = 0;
        if (signature[offset++] !== ENCODED_TAG_SEQ) {
          throw new Error('Could not find expected "seq"');
        }
        var seqLength = signature[offset++];
        if (seqLength === (MAX_OCTET | 1)) {
          seqLength = signature[offset++];
        }
        if (inputLength - offset < seqLength) {
          throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
        }
        if (signature[offset++] !== ENCODED_TAG_INT) {
          throw new Error('Could not find expected "int" for "r"');
        }
        var rLength = signature[offset++];
        if (inputLength - offset - 2 < rLength) {
          throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
        }
        if (maxEncodedParamLength < rLength) {
          throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
        }
        var rOffset = offset;
        offset += rLength;
        if (signature[offset++] !== ENCODED_TAG_INT) {
          throw new Error('Could not find expected "int" for "s"');
        }
        var sLength = signature[offset++];
        if (inputLength - offset !== sLength) {
          throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
        }
        if (maxEncodedParamLength < sLength) {
          throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
        }
        var sOffset = offset;
        offset += sLength;
        if (offset !== inputLength) {
          throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
        }
        var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
        var dst = Buffer2.allocUnsafe(rPadding + rLength + sPadding + sLength);
        for (offset = 0; offset < rPadding; ++offset) {
          dst[offset] = 0;
        }
        signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
        offset = paramBytes;
        for (var o = offset; offset < o + sPadding; ++offset) {
          dst[offset] = 0;
        }
        signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
        dst = dst.toString("base64");
        dst = base64Url(dst);
        return dst;
      }
      function countPadding(buf, start, stop) {
        var padding = 0;
        while (start + padding < stop && buf[start + padding] === 0) {
          ++padding;
        }
        var needsSign = buf[start + padding] >= MAX_OCTET;
        if (needsSign) {
          --padding;
        }
        return padding;
      }
      function joseToDer(signature, alg) {
        signature = signatureAsBuffer(signature);
        var paramBytes = getParamBytesForAlg(alg);
        var signatureBytes = signature.length;
        if (signatureBytes !== paramBytes * 2) {
          throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
        }
        var rPadding = countPadding(signature, 0, paramBytes);
        var sPadding = countPadding(signature, paramBytes, signature.length);
        var rLength = paramBytes - rPadding;
        var sLength = paramBytes - sPadding;
        var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
        var shortLength = rsBytes < MAX_OCTET;
        var dst = Buffer2.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
        var offset = 0;
        dst[offset++] = ENCODED_TAG_SEQ;
        if (shortLength) {
          dst[offset++] = rsBytes;
        } else {
          dst[offset++] = MAX_OCTET | 1;
          dst[offset++] = rsBytes & 255;
        }
        dst[offset++] = ENCODED_TAG_INT;
        dst[offset++] = rLength;
        if (rPadding < 0) {
          dst[offset++] = 0;
          offset += signature.copy(dst, offset, 0, paramBytes);
        } else {
          offset += signature.copy(dst, offset, rPadding, paramBytes);
        }
        dst[offset++] = ENCODED_TAG_INT;
        dst[offset++] = sLength;
        if (sPadding < 0) {
          dst[offset++] = 0;
          signature.copy(dst, offset, paramBytes);
        } else {
          signature.copy(dst, offset, paramBytes + sPadding);
        }
        return dst;
      }
      module.exports = {
        derToJose,
        joseToDer
      };
    }
  });

  // node_modules/buffer-equal-constant-time/index.js
  var require_buffer_equal_constant_time = __commonJS({
    "node_modules/buffer-equal-constant-time/index.js"(exports, module) {
      "use strict";
      var Buffer2 = __require("buffer").Buffer;
      var SlowBuffer = __require("buffer").SlowBuffer;
      module.exports = bufferEq;
      function bufferEq(a, b) {
        if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
          return false;
        }
        if (a.length !== b.length) {
          return false;
        }
        var c = 0;
        for (var i = 0; i < a.length; i++) {
          c |= a[i] ^ b[i];
        }
        return c === 0;
      }
      bufferEq.install = function() {
        Buffer2.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
          return bufferEq(this, that);
        };
      };
      var origBufEqual = Buffer2.prototype.equal;
      var origSlowBufEqual = SlowBuffer.prototype.equal;
      bufferEq.restore = function() {
        Buffer2.prototype.equal = origBufEqual;
        SlowBuffer.prototype.equal = origSlowBufEqual;
      };
    }
  });

  // node_modules/jwa/index.js
  var require_jwa = __commonJS({
    "node_modules/jwa/index.js"(exports, module) {
      var Buffer2 = require_safe_buffer().Buffer;
      var crypto2 = __require("crypto");
      var formatEcdsa = require_ecdsa_sig_formatter();
      var util = __require("util");
      var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
      var MSG_INVALID_SECRET = "secret must be a string or buffer";
      var MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer";
      var MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object";
      var supportsKeyObjects = typeof crypto2.createPublicKey === "function";
      if (supportsKeyObjects) {
        MSG_INVALID_VERIFIER_KEY += " or a KeyObject";
        MSG_INVALID_SECRET += "or a KeyObject";
      }
      function checkIsPublicKey(key) {
        if (Buffer2.isBuffer(key)) {
          return;
        }
        if (typeof key === "string") {
          return;
        }
        if (!supportsKeyObjects) {
          throw typeError(MSG_INVALID_VERIFIER_KEY);
        }
        if (typeof key !== "object") {
          throw typeError(MSG_INVALID_VERIFIER_KEY);
        }
        if (typeof key.type !== "string") {
          throw typeError(MSG_INVALID_VERIFIER_KEY);
        }
        if (typeof key.asymmetricKeyType !== "string") {
          throw typeError(MSG_INVALID_VERIFIER_KEY);
        }
        if (typeof key.export !== "function") {
          throw typeError(MSG_INVALID_VERIFIER_KEY);
        }
      }
      function checkIsPrivateKey(key) {
        if (Buffer2.isBuffer(key)) {
          return;
        }
        if (typeof key === "string") {
          return;
        }
        if (typeof key === "object") {
          return;
        }
        throw typeError(MSG_INVALID_SIGNER_KEY);
      }
      function checkIsSecretKey(key) {
        if (Buffer2.isBuffer(key)) {
          return;
        }
        if (typeof key === "string") {
          return key;
        }
        if (!supportsKeyObjects) {
          throw typeError(MSG_INVALID_SECRET);
        }
        if (typeof key !== "object") {
          throw typeError(MSG_INVALID_SECRET);
        }
        if (key.type !== "secret") {
          throw typeError(MSG_INVALID_SECRET);
        }
        if (typeof key.export !== "function") {
          throw typeError(MSG_INVALID_SECRET);
        }
      }
      function fromBase64(base64) {
        return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      }
      function toBase64(base64url) {
        base64url = base64url.toString();
        var padding = 4 - base64url.length % 4;
        if (padding !== 4) {
          for (var i = 0; i < padding; ++i) {
            base64url += "=";
          }
        }
        return base64url.replace(/\-/g, "+").replace(/_/g, "/");
      }
      function typeError(template) {
        var args = [].slice.call(arguments, 1);
        var errMsg = util.format.bind(util, template).apply(null, args);
        return new TypeError(errMsg);
      }
      function bufferOrString(obj) {
        return Buffer2.isBuffer(obj) || typeof obj === "string";
      }
      function normalizeInput(thing) {
        if (!bufferOrString(thing))
          thing = JSON.stringify(thing);
        return thing;
      }
      function createHmacSigner(bits) {
        return function sign(thing, secret) {
          checkIsSecretKey(secret);
          thing = normalizeInput(thing);
          var hmac = crypto2.createHmac("sha" + bits, secret);
          var sig = (hmac.update(thing), hmac.digest("base64"));
          return fromBase64(sig);
        };
      }
      var bufferEqual;
      var timingSafeEqual = "timingSafeEqual" in crypto2 ? function timingSafeEqual2(a, b) {
        if (a.byteLength !== b.byteLength) {
          return false;
        }
        return crypto2.timingSafeEqual(a, b);
      } : function timingSafeEqual2(a, b) {
        if (!bufferEqual) {
          bufferEqual = require_buffer_equal_constant_time();
        }
        return bufferEqual(a, b);
      };
      function createHmacVerifier(bits) {
        return function verify(thing, signature, secret) {
          var computedSig = createHmacSigner(bits)(thing, secret);
          return timingSafeEqual(Buffer2.from(signature), Buffer2.from(computedSig));
        };
      }
      function createKeySigner(bits) {
        return function sign(thing, privateKey) {
          checkIsPrivateKey(privateKey);
          thing = normalizeInput(thing);
          var signer = crypto2.createSign("RSA-SHA" + bits);
          var sig = (signer.update(thing), signer.sign(privateKey, "base64"));
          return fromBase64(sig);
        };
      }
      function createKeyVerifier(bits) {
        return function verify(thing, signature, publicKey) {
          checkIsPublicKey(publicKey);
          thing = normalizeInput(thing);
          signature = toBase64(signature);
          var verifier = crypto2.createVerify("RSA-SHA" + bits);
          verifier.update(thing);
          return verifier.verify(publicKey, signature, "base64");
        };
      }
      function createPSSKeySigner(bits) {
        return function sign(thing, privateKey) {
          checkIsPrivateKey(privateKey);
          thing = normalizeInput(thing);
          var signer = crypto2.createSign("RSA-SHA" + bits);
          var sig = (signer.update(thing), signer.sign({
            key: privateKey,
            padding: crypto2.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: crypto2.constants.RSA_PSS_SALTLEN_DIGEST
          }, "base64"));
          return fromBase64(sig);
        };
      }
      function createPSSKeyVerifier(bits) {
        return function verify(thing, signature, publicKey) {
          checkIsPublicKey(publicKey);
          thing = normalizeInput(thing);
          signature = toBase64(signature);
          var verifier = crypto2.createVerify("RSA-SHA" + bits);
          verifier.update(thing);
          return verifier.verify({
            key: publicKey,
            padding: crypto2.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: crypto2.constants.RSA_PSS_SALTLEN_DIGEST
          }, signature, "base64");
        };
      }
      function createECDSASigner(bits) {
        var inner = createKeySigner(bits);
        return function sign() {
          var signature = inner.apply(null, arguments);
          signature = formatEcdsa.derToJose(signature, "ES" + bits);
          return signature;
        };
      }
      function createECDSAVerifer(bits) {
        var inner = createKeyVerifier(bits);
        return function verify(thing, signature, publicKey) {
          signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
          var result = inner(thing, signature, publicKey);
          return result;
        };
      }
      function createNoneSigner() {
        return function sign() {
          return "";
        };
      }
      function createNoneVerifier() {
        return function verify(thing, signature) {
          return signature === "";
        };
      }
      module.exports = function jwa(algorithm) {
        var signerFactories = {
          hs: createHmacSigner,
          rs: createKeySigner,
          ps: createPSSKeySigner,
          es: createECDSASigner,
          none: createNoneSigner
        };
        var verifierFactories = {
          hs: createHmacVerifier,
          rs: createKeyVerifier,
          ps: createPSSKeyVerifier,
          es: createECDSAVerifer,
          none: createNoneVerifier
        };
        var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
        if (!match)
          throw typeError(MSG_INVALID_ALGORITHM, algorithm);
        var algo = (match[1] || match[3]).toLowerCase();
        var bits = match[2];
        return {
          sign: signerFactories[algo](bits),
          verify: verifierFactories[algo](bits)
        };
      };
    }
  });

  // node_modules/jws/lib/tostring.js
  var require_tostring = __commonJS({
    "node_modules/jws/lib/tostring.js"(exports, module) {
      var Buffer2 = __require("buffer").Buffer;
      module.exports = function toString(obj) {
        if (typeof obj === "string")
          return obj;
        if (typeof obj === "number" || Buffer2.isBuffer(obj))
          return obj.toString();
        return JSON.stringify(obj);
      };
    }
  });

  // node_modules/jws/lib/sign-stream.js
  var require_sign_stream = __commonJS({
    "node_modules/jws/lib/sign-stream.js"(exports, module) {
      var Buffer2 = require_safe_buffer().Buffer;
      var DataStream = require_data_stream();
      var jwa = require_jwa();
      var Stream = __require("stream");
      var toString = require_tostring();
      var util = __require("util");
      function base64url(string, encoding) {
        return Buffer2.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      }
      function jwsSecuredInput(header, payload, encoding) {
        encoding = encoding || "utf8";
        var encodedHeader = base64url(toString(header), "binary");
        var encodedPayload = base64url(toString(payload), encoding);
        return util.format("%s.%s", encodedHeader, encodedPayload);
      }
      function jwsSign(opts) {
        var header = opts.header;
        var payload = opts.payload;
        var secretOrKey = opts.secret || opts.privateKey;
        var encoding = opts.encoding;
        var algo = jwa(header.alg);
        var securedInput = jwsSecuredInput(header, payload, encoding);
        var signature = algo.sign(securedInput, secretOrKey);
        return util.format("%s.%s", securedInput, signature);
      }
      function SignStream(opts) {
        var secret = opts.secret;
        secret = secret == null ? opts.privateKey : secret;
        secret = secret == null ? opts.key : secret;
        if (/^hs/i.test(opts.header.alg) === true && secret == null) {
          throw new TypeError("secret must be a string or buffer or a KeyObject");
        }
        var secretStream = new DataStream(secret);
        this.readable = true;
        this.header = opts.header;
        this.encoding = opts.encoding;
        this.secret = this.privateKey = this.key = secretStream;
        this.payload = new DataStream(opts.payload);
        this.secret.once("close", function() {
          if (!this.payload.writable && this.readable)
            this.sign();
        }.bind(this));
        this.payload.once("close", function() {
          if (!this.secret.writable && this.readable)
            this.sign();
        }.bind(this));
      }
      util.inherits(SignStream, Stream);
      SignStream.prototype.sign = function sign() {
        try {
          var signature = jwsSign({
            header: this.header,
            payload: this.payload.buffer,
            secret: this.secret.buffer,
            encoding: this.encoding
          });
          this.emit("done", signature);
          this.emit("data", signature);
          this.emit("end");
          this.readable = false;
          return signature;
        } catch (e) {
          this.readable = false;
          this.emit("error", e);
          this.emit("close");
        }
      };
      SignStream.sign = jwsSign;
      module.exports = SignStream;
    }
  });

  // node_modules/jws/lib/verify-stream.js
  var require_verify_stream = __commonJS({
    "node_modules/jws/lib/verify-stream.js"(exports, module) {
      var Buffer2 = require_safe_buffer().Buffer;
      var DataStream = require_data_stream();
      var jwa = require_jwa();
      var Stream = __require("stream");
      var toString = require_tostring();
      var util = __require("util");
      var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
      function isObject(thing) {
        return Object.prototype.toString.call(thing) === "[object Object]";
      }
      function safeJsonParse(thing) {
        if (isObject(thing))
          return thing;
        try {
          return JSON.parse(thing);
        } catch (e) {
          return void 0;
        }
      }
      function headerFromJWS(jwsSig) {
        var encodedHeader = jwsSig.split(".", 1)[0];
        return safeJsonParse(Buffer2.from(encodedHeader, "base64").toString("binary"));
      }
      function securedInputFromJWS(jwsSig) {
        return jwsSig.split(".", 2).join(".");
      }
      function signatureFromJWS(jwsSig) {
        return jwsSig.split(".")[2];
      }
      function payloadFromJWS(jwsSig, encoding) {
        encoding = encoding || "utf8";
        var payload = jwsSig.split(".")[1];
        return Buffer2.from(payload, "base64").toString(encoding);
      }
      function isValidJws(string) {
        return JWS_REGEX.test(string) && !!headerFromJWS(string);
      }
      function jwsVerify(jwsSig, algorithm, secretOrKey) {
        if (!algorithm) {
          var err = new Error("Missing algorithm parameter for jws.verify");
          err.code = "MISSING_ALGORITHM";
          throw err;
        }
        jwsSig = toString(jwsSig);
        var signature = signatureFromJWS(jwsSig);
        var securedInput = securedInputFromJWS(jwsSig);
        var algo = jwa(algorithm);
        return algo.verify(securedInput, signature, secretOrKey);
      }
      function jwsDecode(jwsSig, opts) {
        opts = opts || {};
        jwsSig = toString(jwsSig);
        if (!isValidJws(jwsSig))
          return null;
        var header = headerFromJWS(jwsSig);
        if (!header)
          return null;
        var payload = payloadFromJWS(jwsSig);
        if (header.typ === "JWT" || opts.json)
          payload = JSON.parse(payload, opts.encoding);
        return {
          header,
          payload,
          signature: signatureFromJWS(jwsSig)
        };
      }
      function VerifyStream(opts) {
        opts = opts || {};
        var secretOrKey = opts.secret;
        secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
        secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
        if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) {
          throw new TypeError("secret must be a string or buffer or a KeyObject");
        }
        var secretStream = new DataStream(secretOrKey);
        this.readable = true;
        this.algorithm = opts.algorithm;
        this.encoding = opts.encoding;
        this.secret = this.publicKey = this.key = secretStream;
        this.signature = new DataStream(opts.signature);
        this.secret.once("close", function() {
          if (!this.signature.writable && this.readable)
            this.verify();
        }.bind(this));
        this.signature.once("close", function() {
          if (!this.secret.writable && this.readable)
            this.verify();
        }.bind(this));
      }
      util.inherits(VerifyStream, Stream);
      VerifyStream.prototype.verify = function verify() {
        try {
          var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
          var obj = jwsDecode(this.signature.buffer, this.encoding);
          this.emit("done", valid, obj);
          this.emit("data", valid);
          this.emit("end");
          this.readable = false;
          return valid;
        } catch (e) {
          this.readable = false;
          this.emit("error", e);
          this.emit("close");
        }
      };
      VerifyStream.decode = jwsDecode;
      VerifyStream.isValid = isValidJws;
      VerifyStream.verify = jwsVerify;
      module.exports = VerifyStream;
    }
  });

  // node_modules/jws/index.js
  var require_jws = __commonJS({
    "node_modules/jws/index.js"(exports) {
      var SignStream = require_sign_stream();
      var VerifyStream = require_verify_stream();
      var ALGORITHMS = [
        "HS256",
        "HS384",
        "HS512",
        "RS256",
        "RS384",
        "RS512",
        "PS256",
        "PS384",
        "PS512",
        "ES256",
        "ES384",
        "ES512"
      ];
      exports.ALGORITHMS = ALGORITHMS;
      exports.sign = SignStream.sign;
      exports.verify = VerifyStream.verify;
      exports.decode = VerifyStream.decode;
      exports.isValid = VerifyStream.isValid;
      exports.createSign = function createSign(opts) {
        return new SignStream(opts);
      };
      exports.createVerify = function createVerify(opts) {
        return new VerifyStream(opts);
      };
    }
  });

  // node_modules/jsonwebtoken/decode.js
  var require_decode = __commonJS({
    "node_modules/jsonwebtoken/decode.js"(exports, module) {
      var jws = require_jws();
      module.exports = function(jwt, options) {
        options = options || {};
        var decoded = jws.decode(jwt, options);
        if (!decoded) {
          return null;
        }
        var payload = decoded.payload;
        if (typeof payload === "string") {
          try {
            var obj = JSON.parse(payload);
            if (obj !== null && typeof obj === "object") {
              payload = obj;
            }
          } catch (e) {
          }
        }
        if (options.complete === true) {
          return {
            header: decoded.header,
            payload,
            signature: decoded.signature
          };
        }
        return payload;
      };
    }
  });

  // node_modules/jsonwebtoken/lib/JsonWebTokenError.js
  var require_JsonWebTokenError = __commonJS({
    "node_modules/jsonwebtoken/lib/JsonWebTokenError.js"(exports, module) {
      var JsonWebTokenError = function(message, error) {
        Error.call(this, message);
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, this.constructor);
        }
        this.name = "JsonWebTokenError";
        this.message = message;
        if (error) this.inner = error;
      };
      JsonWebTokenError.prototype = Object.create(Error.prototype);
      JsonWebTokenError.prototype.constructor = JsonWebTokenError;
      module.exports = JsonWebTokenError;
    }
  });

  // node_modules/jsonwebtoken/lib/NotBeforeError.js
  var require_NotBeforeError = __commonJS({
    "node_modules/jsonwebtoken/lib/NotBeforeError.js"(exports, module) {
      var JsonWebTokenError = require_JsonWebTokenError();
      var NotBeforeError = function(message, date) {
        JsonWebTokenError.call(this, message);
        this.name = "NotBeforeError";
        this.date = date;
      };
      NotBeforeError.prototype = Object.create(JsonWebTokenError.prototype);
      NotBeforeError.prototype.constructor = NotBeforeError;
      module.exports = NotBeforeError;
    }
  });

  // node_modules/jsonwebtoken/lib/TokenExpiredError.js
  var require_TokenExpiredError = __commonJS({
    "node_modules/jsonwebtoken/lib/TokenExpiredError.js"(exports, module) {
      var JsonWebTokenError = require_JsonWebTokenError();
      var TokenExpiredError = function(message, expiredAt) {
        JsonWebTokenError.call(this, message);
        this.name = "TokenExpiredError";
        this.expiredAt = expiredAt;
      };
      TokenExpiredError.prototype = Object.create(JsonWebTokenError.prototype);
      TokenExpiredError.prototype.constructor = TokenExpiredError;
      module.exports = TokenExpiredError;
    }
  });

  // node_modules/ms/index.js
  var require_ms = __commonJS({
    "node_modules/ms/index.js"(exports, module) {
      var s = 1e3;
      var m = s * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error(
          "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
        );
      };
      function parse(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s) {
          return Math.round(ms / s) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s) {
          return plural(ms, msAbs, s, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // node_modules/jsonwebtoken/lib/timespan.js
  var require_timespan = __commonJS({
    "node_modules/jsonwebtoken/lib/timespan.js"(exports, module) {
      var ms = require_ms();
      module.exports = function(time, iat) {
        var timestamp = iat || Math.floor(Date.now() / 1e3);
        if (typeof time === "string") {
          var milliseconds = ms(time);
          if (typeof milliseconds === "undefined") {
            return;
          }
          return Math.floor(timestamp + milliseconds / 1e3);
        } else if (typeof time === "number") {
          return timestamp + time;
        } else {
          return;
        }
      };
    }
  });

  // node_modules/semver/internal/constants.js
  var require_constants = __commonJS({
    "node_modules/semver/internal/constants.js"(exports, module) {
      "use strict";
      var SEMVER_SPEC_VERSION = "2.0.0";
      var MAX_LENGTH = 256;
      var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
      9007199254740991;
      var MAX_SAFE_COMPONENT_LENGTH = 16;
      var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
      var RELEASE_TYPES = [
        "major",
        "premajor",
        "minor",
        "preminor",
        "patch",
        "prepatch",
        "prerelease"
      ];
      module.exports = {
        MAX_LENGTH,
        MAX_SAFE_COMPONENT_LENGTH,
        MAX_SAFE_BUILD_LENGTH,
        MAX_SAFE_INTEGER,
        RELEASE_TYPES,
        SEMVER_SPEC_VERSION,
        FLAG_INCLUDE_PRERELEASE: 1,
        FLAG_LOOSE: 2
      };
    }
  });

  // node_modules/semver/internal/debug.js
  var require_debug = __commonJS({
    "node_modules/semver/internal/debug.js"(exports, module) {
      "use strict";
      var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
      };
      module.exports = debug;
    }
  });

  // node_modules/semver/internal/re.js
  var require_re = __commonJS({
    "node_modules/semver/internal/re.js"(exports, module) {
      "use strict";
      var {
        MAX_SAFE_COMPONENT_LENGTH,
        MAX_SAFE_BUILD_LENGTH,
        MAX_LENGTH
      } = require_constants();
      var debug = require_debug();
      exports = module.exports = {};
      var re = exports.re = [];
      var safeRe = exports.safeRe = [];
      var src = exports.src = [];
      var safeSrc = exports.safeSrc = [];
      var t = exports.t = {};
      var R = 0;
      var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
      var safeRegexReplacements = [
        ["\\s", 1],
        ["\\d", MAX_LENGTH],
        [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
      ];
      var makeSafeRegex = (value) => {
        for (const [token, max] of safeRegexReplacements) {
          value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
        }
        return value;
      };
      var createToken = (name, value, isGlobal) => {
        const safe = makeSafeRegex(value);
        const index = R++;
        debug(name, index, value);
        t[name] = index;
        src[index] = value;
        safeSrc[index] = safe;
        re[index] = new RegExp(value, isGlobal ? "g" : void 0);
        safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
      };
      createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
      createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
      createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
      createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
      createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
      createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
      createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
      createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
      createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
      createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
      createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
      createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
      createToken("FULL", `^${src[t.FULLPLAIN]}$`);
      createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
      createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
      createToken("GTLT", "((?:<|>)?=?)");
      createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
      createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
      createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
      createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
      createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
      createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
      createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
      createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
      createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
      createToken("COERCERTL", src[t.COERCE], true);
      createToken("COERCERTLFULL", src[t.COERCEFULL], true);
      createToken("LONETILDE", "(?:~>?)");
      createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
      exports.tildeTrimReplace = "$1~";
      createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
      createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
      createToken("LONECARET", "(?:\\^)");
      createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
      exports.caretTrimReplace = "$1^";
      createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
      createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
      createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
      createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
      createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
      exports.comparatorTrimReplace = "$1$2$3";
      createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
      createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
      createToken("STAR", "(<|>)?=?\\s*\\*");
      createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
      createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
    }
  });

  // node_modules/semver/internal/parse-options.js
  var require_parse_options = __commonJS({
    "node_modules/semver/internal/parse-options.js"(exports, module) {
      "use strict";
      var looseOption = Object.freeze({ loose: true });
      var emptyOpts = Object.freeze({});
      var parseOptions = (options) => {
        if (!options) {
          return emptyOpts;
        }
        if (typeof options !== "object") {
          return looseOption;
        }
        return options;
      };
      module.exports = parseOptions;
    }
  });

  // node_modules/semver/internal/identifiers.js
  var require_identifiers = __commonJS({
    "node_modules/semver/internal/identifiers.js"(exports, module) {
      "use strict";
      var numeric = /^[0-9]+$/;
      var compareIdentifiers = (a, b) => {
        if (typeof a === "number" && typeof b === "number") {
          return a === b ? 0 : a < b ? -1 : 1;
        }
        const anum = numeric.test(a);
        const bnum = numeric.test(b);
        if (anum && bnum) {
          a = +a;
          b = +b;
        }
        return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
      };
      var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
      module.exports = {
        compareIdentifiers,
        rcompareIdentifiers
      };
    }
  });

  // node_modules/semver/classes/semver.js
  var require_semver = __commonJS({
    "node_modules/semver/classes/semver.js"(exports, module) {
      "use strict";
      var debug = require_debug();
      var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
      var { safeRe: re, t } = require_re();
      var parseOptions = require_parse_options();
      var { compareIdentifiers } = require_identifiers();
      var SemVer = class _SemVer {
        constructor(version, options) {
          options = parseOptions(options);
          if (version instanceof _SemVer) {
            if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
              return version;
            } else {
              version = version.version;
            }
          } else if (typeof version !== "string") {
            throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
          }
          if (version.length > MAX_LENGTH) {
            throw new TypeError(
              `version is longer than ${MAX_LENGTH} characters`
            );
          }
          debug("SemVer", version, options);
          this.options = options;
          this.loose = !!options.loose;
          this.includePrerelease = !!options.includePrerelease;
          const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
          if (!m) {
            throw new TypeError(`Invalid Version: ${version}`);
          }
          this.raw = version;
          this.major = +m[1];
          this.minor = +m[2];
          this.patch = +m[3];
          if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
            throw new TypeError("Invalid major version");
          }
          if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
            throw new TypeError("Invalid minor version");
          }
          if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
            throw new TypeError("Invalid patch version");
          }
          if (!m[4]) {
            this.prerelease = [];
          } else {
            this.prerelease = m[4].split(".").map((id) => {
              if (/^[0-9]+$/.test(id)) {
                const num = +id;
                if (num >= 0 && num < MAX_SAFE_INTEGER) {
                  return num;
                }
              }
              return id;
            });
          }
          this.build = m[5] ? m[5].split(".") : [];
          this.format();
        }
        format() {
          this.version = `${this.major}.${this.minor}.${this.patch}`;
          if (this.prerelease.length) {
            this.version += `-${this.prerelease.join(".")}`;
          }
          return this.version;
        }
        toString() {
          return this.version;
        }
        compare(other) {
          debug("SemVer.compare", this.version, this.options, other);
          if (!(other instanceof _SemVer)) {
            if (typeof other === "string" && other === this.version) {
              return 0;
            }
            other = new _SemVer(other, this.options);
          }
          if (other.version === this.version) {
            return 0;
          }
          return this.compareMain(other) || this.comparePre(other);
        }
        compareMain(other) {
          if (!(other instanceof _SemVer)) {
            other = new _SemVer(other, this.options);
          }
          if (this.major < other.major) {
            return -1;
          }
          if (this.major > other.major) {
            return 1;
          }
          if (this.minor < other.minor) {
            return -1;
          }
          if (this.minor > other.minor) {
            return 1;
          }
          if (this.patch < other.patch) {
            return -1;
          }
          if (this.patch > other.patch) {
            return 1;
          }
          return 0;
        }
        comparePre(other) {
          if (!(other instanceof _SemVer)) {
            other = new _SemVer(other, this.options);
          }
          if (this.prerelease.length && !other.prerelease.length) {
            return -1;
          } else if (!this.prerelease.length && other.prerelease.length) {
            return 1;
          } else if (!this.prerelease.length && !other.prerelease.length) {
            return 0;
          }
          let i = 0;
          do {
            const a = this.prerelease[i];
            const b = other.prerelease[i];
            debug("prerelease compare", i, a, b);
            if (a === void 0 && b === void 0) {
              return 0;
            } else if (b === void 0) {
              return 1;
            } else if (a === void 0) {
              return -1;
            } else if (a === b) {
              continue;
            } else {
              return compareIdentifiers(a, b);
            }
          } while (++i);
        }
        compareBuild(other) {
          if (!(other instanceof _SemVer)) {
            other = new _SemVer(other, this.options);
          }
          let i = 0;
          do {
            const a = this.build[i];
            const b = other.build[i];
            debug("build compare", i, a, b);
            if (a === void 0 && b === void 0) {
              return 0;
            } else if (b === void 0) {
              return 1;
            } else if (a === void 0) {
              return -1;
            } else if (a === b) {
              continue;
            } else {
              return compareIdentifiers(a, b);
            }
          } while (++i);
        }
        // preminor will bump the version up to the next minor release, and immediately
        // down to pre-release. premajor and prepatch work the same way.
        inc(release, identifier, identifierBase) {
          if (release.startsWith("pre")) {
            if (!identifier && identifierBase === false) {
              throw new Error("invalid increment argument: identifier is empty");
            }
            if (identifier) {
              const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
              if (!match || match[1] !== identifier) {
                throw new Error(`invalid identifier: ${identifier}`);
              }
            }
          }
          switch (release) {
            case "premajor":
              this.prerelease.length = 0;
              this.patch = 0;
              this.minor = 0;
              this.major++;
              this.inc("pre", identifier, identifierBase);
              break;
            case "preminor":
              this.prerelease.length = 0;
              this.patch = 0;
              this.minor++;
              this.inc("pre", identifier, identifierBase);
              break;
            case "prepatch":
              this.prerelease.length = 0;
              this.inc("patch", identifier, identifierBase);
              this.inc("pre", identifier, identifierBase);
              break;
            // If the input is a non-prerelease version, this acts the same as
            // prepatch.
            case "prerelease":
              if (this.prerelease.length === 0) {
                this.inc("patch", identifier, identifierBase);
              }
              this.inc("pre", identifier, identifierBase);
              break;
            case "release":
              if (this.prerelease.length === 0) {
                throw new Error(`version ${this.raw} is not a prerelease`);
              }
              this.prerelease.length = 0;
              break;
            case "major":
              if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
                this.major++;
              }
              this.minor = 0;
              this.patch = 0;
              this.prerelease = [];
              break;
            case "minor":
              if (this.patch !== 0 || this.prerelease.length === 0) {
                this.minor++;
              }
              this.patch = 0;
              this.prerelease = [];
              break;
            case "patch":
              if (this.prerelease.length === 0) {
                this.patch++;
              }
              this.prerelease = [];
              break;
            // This probably shouldn't be used publicly.
            // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
            case "pre": {
              const base = Number(identifierBase) ? 1 : 0;
              if (this.prerelease.length === 0) {
                this.prerelease = [base];
              } else {
                let i = this.prerelease.length;
                while (--i >= 0) {
                  if (typeof this.prerelease[i] === "number") {
                    this.prerelease[i]++;
                    i = -2;
                  }
                }
                if (i === -1) {
                  if (identifier === this.prerelease.join(".") && identifierBase === false) {
                    throw new Error("invalid increment argument: identifier already exists");
                  }
                  this.prerelease.push(base);
                }
              }
              if (identifier) {
                let prerelease = [identifier, base];
                if (identifierBase === false) {
                  prerelease = [identifier];
                }
                if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
                  if (isNaN(this.prerelease[1])) {
                    this.prerelease = prerelease;
                  }
                } else {
                  this.prerelease = prerelease;
                }
              }
              break;
            }
            default:
              throw new Error(`invalid increment argument: ${release}`);
          }
          this.raw = this.format();
          if (this.build.length) {
            this.raw += `+${this.build.join(".")}`;
          }
          return this;
        }
      };
      module.exports = SemVer;
    }
  });

  // node_modules/semver/functions/parse.js
  var require_parse = __commonJS({
    "node_modules/semver/functions/parse.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var parse = (version, options, throwErrors = false) => {
        if (version instanceof SemVer) {
          return version;
        }
        try {
          return new SemVer(version, options);
        } catch (er) {
          if (!throwErrors) {
            return null;
          }
          throw er;
        }
      };
      module.exports = parse;
    }
  });

  // node_modules/semver/functions/valid.js
  var require_valid = __commonJS({
    "node_modules/semver/functions/valid.js"(exports, module) {
      "use strict";
      var parse = require_parse();
      var valid = (version, options) => {
        const v = parse(version, options);
        return v ? v.version : null;
      };
      module.exports = valid;
    }
  });

  // node_modules/semver/functions/clean.js
  var require_clean = __commonJS({
    "node_modules/semver/functions/clean.js"(exports, module) {
      "use strict";
      var parse = require_parse();
      var clean = (version, options) => {
        const s = parse(version.trim().replace(/^[=v]+/, ""), options);
        return s ? s.version : null;
      };
      module.exports = clean;
    }
  });

  // node_modules/semver/functions/inc.js
  var require_inc = __commonJS({
    "node_modules/semver/functions/inc.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var inc = (version, release, options, identifier, identifierBase) => {
        if (typeof options === "string") {
          identifierBase = identifier;
          identifier = options;
          options = void 0;
        }
        try {
          return new SemVer(
            version instanceof SemVer ? version.version : version,
            options
          ).inc(release, identifier, identifierBase).version;
        } catch (er) {
          return null;
        }
      };
      module.exports = inc;
    }
  });

  // node_modules/semver/functions/diff.js
  var require_diff = __commonJS({
    "node_modules/semver/functions/diff.js"(exports, module) {
      "use strict";
      var parse = require_parse();
      var diff = (version1, version2) => {
        const v1 = parse(version1, null, true);
        const v2 = parse(version2, null, true);
        const comparison = v1.compare(v2);
        if (comparison === 0) {
          return null;
        }
        const v1Higher = comparison > 0;
        const highVersion = v1Higher ? v1 : v2;
        const lowVersion = v1Higher ? v2 : v1;
        const highHasPre = !!highVersion.prerelease.length;
        const lowHasPre = !!lowVersion.prerelease.length;
        if (lowHasPre && !highHasPre) {
          if (!lowVersion.patch && !lowVersion.minor) {
            return "major";
          }
          if (lowVersion.compareMain(highVersion) === 0) {
            if (lowVersion.minor && !lowVersion.patch) {
              return "minor";
            }
            return "patch";
          }
        }
        const prefix = highHasPre ? "pre" : "";
        if (v1.major !== v2.major) {
          return prefix + "major";
        }
        if (v1.minor !== v2.minor) {
          return prefix + "minor";
        }
        if (v1.patch !== v2.patch) {
          return prefix + "patch";
        }
        return "prerelease";
      };
      module.exports = diff;
    }
  });

  // node_modules/semver/functions/major.js
  var require_major = __commonJS({
    "node_modules/semver/functions/major.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var major = (a, loose) => new SemVer(a, loose).major;
      module.exports = major;
    }
  });

  // node_modules/semver/functions/minor.js
  var require_minor = __commonJS({
    "node_modules/semver/functions/minor.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var minor = (a, loose) => new SemVer(a, loose).minor;
      module.exports = minor;
    }
  });

  // node_modules/semver/functions/patch.js
  var require_patch = __commonJS({
    "node_modules/semver/functions/patch.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var patch = (a, loose) => new SemVer(a, loose).patch;
      module.exports = patch;
    }
  });

  // node_modules/semver/functions/prerelease.js
  var require_prerelease = __commonJS({
    "node_modules/semver/functions/prerelease.js"(exports, module) {
      "use strict";
      var parse = require_parse();
      var prerelease = (version, options) => {
        const parsed = parse(version, options);
        return parsed && parsed.prerelease.length ? parsed.prerelease : null;
      };
      module.exports = prerelease;
    }
  });

  // node_modules/semver/functions/compare.js
  var require_compare = __commonJS({
    "node_modules/semver/functions/compare.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
      module.exports = compare;
    }
  });

  // node_modules/semver/functions/rcompare.js
  var require_rcompare = __commonJS({
    "node_modules/semver/functions/rcompare.js"(exports, module) {
      "use strict";
      var compare = require_compare();
      var rcompare = (a, b, loose) => compare(b, a, loose);
      module.exports = rcompare;
    }
  });

  // node_modules/semver/functions/compare-loose.js
  var require_compare_loose = __commonJS({
    "node_modules/semver/functions/compare-loose.js"(exports, module) {
      "use strict";
      var compare = require_compare();
      var compareLoose = (a, b) => compare(a, b, true);
      module.exports = compareLoose;
    }
  });

  // node_modules/semver/functions/compare-build.js
  var require_compare_build = __commonJS({
    "node_modules/semver/functions/compare-build.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var compareBuild = (a, b, loose) => {
        const versionA = new SemVer(a, loose);
        const versionB = new SemVer(b, loose);
        return versionA.compare(versionB) || versionA.compareBuild(versionB);
      };
      module.exports = compareBuild;
    }
  });

  // node_modules/semver/functions/sort.js
  var require_sort = __commonJS({
    "node_modules/semver/functions/sort.js"(exports, module) {
      "use strict";
      var compareBuild = require_compare_build();
      var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
      module.exports = sort;
    }
  });

  // node_modules/semver/functions/rsort.js
  var require_rsort = __commonJS({
    "node_modules/semver/functions/rsort.js"(exports, module) {
      "use strict";
      var compareBuild = require_compare_build();
      var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
      module.exports = rsort;
    }
  });

  // node_modules/semver/functions/gt.js
  var require_gt = __commonJS({
    "node_modules/semver/functions/gt.js"(exports, module) {
      "use strict";
      var compare = require_compare();
      var gt = (a, b, loose) => compare(a, b, loose) > 0;
      module.exports = gt;
    }
  });

  // node_modules/semver/functions/lt.js
  var require_lt = __commonJS({
    "node_modules/semver/functions/lt.js"(exports, module) {
      "use strict";
      var compare = require_compare();
      var lt = (a, b, loose) => compare(a, b, loose) < 0;
      module.exports = lt;
    }
  });

  // node_modules/semver/functions/eq.js
  var require_eq = __commonJS({
    "node_modules/semver/functions/eq.js"(exports, module) {
      "use strict";
      var compare = require_compare();
      var eq = (a, b, loose) => compare(a, b, loose) === 0;
      module.exports = eq;
    }
  });

  // node_modules/semver/functions/neq.js
  var require_neq = __commonJS({
    "node_modules/semver/functions/neq.js"(exports, module) {
      "use strict";
      var compare = require_compare();
      var neq = (a, b, loose) => compare(a, b, loose) !== 0;
      module.exports = neq;
    }
  });

  // node_modules/semver/functions/gte.js
  var require_gte = __commonJS({
    "node_modules/semver/functions/gte.js"(exports, module) {
      "use strict";
      var compare = require_compare();
      var gte = (a, b, loose) => compare(a, b, loose) >= 0;
      module.exports = gte;
    }
  });

  // node_modules/semver/functions/lte.js
  var require_lte = __commonJS({
    "node_modules/semver/functions/lte.js"(exports, module) {
      "use strict";
      var compare = require_compare();
      var lte = (a, b, loose) => compare(a, b, loose) <= 0;
      module.exports = lte;
    }
  });

  // node_modules/semver/functions/cmp.js
  var require_cmp = __commonJS({
    "node_modules/semver/functions/cmp.js"(exports, module) {
      "use strict";
      var eq = require_eq();
      var neq = require_neq();
      var gt = require_gt();
      var gte = require_gte();
      var lt = require_lt();
      var lte = require_lte();
      var cmp = (a, op, b, loose) => {
        switch (op) {
          case "===":
            if (typeof a === "object") {
              a = a.version;
            }
            if (typeof b === "object") {
              b = b.version;
            }
            return a === b;
          case "!==":
            if (typeof a === "object") {
              a = a.version;
            }
            if (typeof b === "object") {
              b = b.version;
            }
            return a !== b;
          case "":
          case "=":
          case "==":
            return eq(a, b, loose);
          case "!=":
            return neq(a, b, loose);
          case ">":
            return gt(a, b, loose);
          case ">=":
            return gte(a, b, loose);
          case "<":
            return lt(a, b, loose);
          case "<=":
            return lte(a, b, loose);
          default:
            throw new TypeError(`Invalid operator: ${op}`);
        }
      };
      module.exports = cmp;
    }
  });

  // node_modules/semver/functions/coerce.js
  var require_coerce = __commonJS({
    "node_modules/semver/functions/coerce.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var parse = require_parse();
      var { safeRe: re, t } = require_re();
      var coerce = (version, options) => {
        if (version instanceof SemVer) {
          return version;
        }
        if (typeof version === "number") {
          version = String(version);
        }
        if (typeof version !== "string") {
          return null;
        }
        options = options || {};
        let match = null;
        if (!options.rtl) {
          match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
        } else {
          const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
          let next;
          while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
            if (!match || next.index + next[0].length !== match.index + match[0].length) {
              match = next;
            }
            coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
          }
          coerceRtlRegex.lastIndex = -1;
        }
        if (match === null) {
          return null;
        }
        const major = match[2];
        const minor = match[3] || "0";
        const patch = match[4] || "0";
        const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
        const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
        return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
      };
      module.exports = coerce;
    }
  });

  // node_modules/semver/functions/truncate.js
  var require_truncate = __commonJS({
    "node_modules/semver/functions/truncate.js"(exports, module) {
      "use strict";
      var parse = require_parse();
      var constants = require_constants();
      var SemVer = require_semver();
      var truncate = (version, truncation, options) => {
        if (!constants.RELEASE_TYPES.includes(truncation)) {
          return null;
        }
        const clonedVersion = cloneInputVersion(version, options);
        return clonedVersion && doTruncation(clonedVersion, truncation);
      };
      var cloneInputVersion = (version, options) => {
        const versionStringToParse = version instanceof SemVer ? version.version : version;
        return parse(versionStringToParse, options);
      };
      var doTruncation = (version, truncation) => {
        if (isPrerelease(truncation)) {
          return version.version;
        }
        version.prerelease = [];
        switch (truncation) {
          case "major":
            version.minor = 0;
            version.patch = 0;
            break;
          case "minor":
            version.patch = 0;
            break;
        }
        return version.format();
      };
      var isPrerelease = (type) => {
        return type.startsWith("pre");
      };
      module.exports = truncate;
    }
  });

  // node_modules/semver/internal/lrucache.js
  var require_lrucache = __commonJS({
    "node_modules/semver/internal/lrucache.js"(exports, module) {
      "use strict";
      var LRUCache = class {
        constructor() {
          this.max = 1e3;
          this.map = /* @__PURE__ */ new Map();
        }
        get(key) {
          const value = this.map.get(key);
          if (value === void 0) {
            return void 0;
          } else {
            this.map.delete(key);
            this.map.set(key, value);
            return value;
          }
        }
        delete(key) {
          return this.map.delete(key);
        }
        set(key, value) {
          const deleted = this.delete(key);
          if (!deleted && value !== void 0) {
            if (this.map.size >= this.max) {
              const firstKey = this.map.keys().next().value;
              this.delete(firstKey);
            }
            this.map.set(key, value);
          }
          return this;
        }
      };
      module.exports = LRUCache;
    }
  });

  // node_modules/semver/classes/range.js
  var require_range = __commonJS({
    "node_modules/semver/classes/range.js"(exports, module) {
      "use strict";
      var SPACE_CHARACTERS = /\s+/g;
      var Range = class _Range {
        constructor(range, options) {
          options = parseOptions(options);
          if (range instanceof _Range) {
            if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
              return range;
            } else {
              return new _Range(range.raw, options);
            }
          }
          if (range instanceof Comparator) {
            this.raw = range.value;
            this.set = [[range]];
            this.formatted = void 0;
            return this;
          }
          this.options = options;
          this.loose = !!options.loose;
          this.includePrerelease = !!options.includePrerelease;
          this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
          this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
          if (!this.set.length) {
            throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
          }
          if (this.set.length > 1) {
            const first = this.set[0];
            this.set = this.set.filter((c) => !isNullSet(c[0]));
            if (this.set.length === 0) {
              this.set = [first];
            } else if (this.set.length > 1) {
              for (const c of this.set) {
                if (c.length === 1 && isAny(c[0])) {
                  this.set = [c];
                  break;
                }
              }
            }
          }
          this.formatted = void 0;
        }
        get range() {
          if (this.formatted === void 0) {
            this.formatted = "";
            for (let i = 0; i < this.set.length; i++) {
              if (i > 0) {
                this.formatted += "||";
              }
              const comps = this.set[i];
              for (let k = 0; k < comps.length; k++) {
                if (k > 0) {
                  this.formatted += " ";
                }
                this.formatted += comps[k].toString().trim();
              }
            }
          }
          return this.formatted;
        }
        format() {
          return this.range;
        }
        toString() {
          return this.range;
        }
        parseRange(range) {
          const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
          const memoKey = memoOpts + ":" + range;
          const cached = cache.get(memoKey);
          if (cached) {
            return cached;
          }
          const loose = this.options.loose;
          const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
          range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
          debug("hyphen replace", range);
          range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
          debug("comparator trim", range);
          range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
          debug("tilde trim", range);
          range = range.replace(re[t.CARETTRIM], caretTrimReplace);
          debug("caret trim", range);
          let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
          if (loose) {
            rangeList = rangeList.filter((comp) => {
              debug("loose invalid filter", comp, this.options);
              return !!comp.match(re[t.COMPARATORLOOSE]);
            });
          }
          debug("range list", rangeList);
          const rangeMap = /* @__PURE__ */ new Map();
          const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
          for (const comp of comparators) {
            if (isNullSet(comp)) {
              return [comp];
            }
            rangeMap.set(comp.value, comp);
          }
          if (rangeMap.size > 1 && rangeMap.has("")) {
            rangeMap.delete("");
          }
          const result = [...rangeMap.values()];
          cache.set(memoKey, result);
          return result;
        }
        intersects(range, options) {
          if (!(range instanceof _Range)) {
            throw new TypeError("a Range is required");
          }
          return this.set.some((thisComparators) => {
            return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
              return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
                return rangeComparators.every((rangeComparator) => {
                  return thisComparator.intersects(rangeComparator, options);
                });
              });
            });
          });
        }
        // if ANY of the sets match ALL of its comparators, then pass
        test(version) {
          if (!version) {
            return false;
          }
          if (typeof version === "string") {
            try {
              version = new SemVer(version, this.options);
            } catch (er) {
              return false;
            }
          }
          for (let i = 0; i < this.set.length; i++) {
            if (testSet(this.set[i], version, this.options)) {
              return true;
            }
          }
          return false;
        }
      };
      module.exports = Range;
      var LRU = require_lrucache();
      var cache = new LRU();
      var parseOptions = require_parse_options();
      var Comparator = require_comparator();
      var debug = require_debug();
      var SemVer = require_semver();
      var {
        safeRe: re,
        t,
        comparatorTrimReplace,
        tildeTrimReplace,
        caretTrimReplace
      } = require_re();
      var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
      var isNullSet = (c) => c.value === "<0.0.0-0";
      var isAny = (c) => c.value === "";
      var isSatisfiable = (comparators, options) => {
        let result = true;
        const remainingComparators = comparators.slice();
        let testComparator = remainingComparators.pop();
        while (result && remainingComparators.length) {
          result = remainingComparators.every((otherComparator) => {
            return testComparator.intersects(otherComparator, options);
          });
          testComparator = remainingComparators.pop();
        }
        return result;
      };
      var parseComparator = (comp, options) => {
        comp = comp.replace(re[t.BUILD], "");
        debug("comp", comp, options);
        comp = replaceCarets(comp, options);
        debug("caret", comp);
        comp = replaceTildes(comp, options);
        debug("tildes", comp);
        comp = replaceXRanges(comp, options);
        debug("xrange", comp);
        comp = replaceStars(comp, options);
        debug("stars", comp);
        return comp;
      };
      var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
      var replaceTildes = (comp, options) => {
        return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
      };
      var replaceTilde = (comp, options) => {
        const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
        return comp.replace(r, (_, M, m, p, pr) => {
          debug("tilde", comp, _, M, m, p, pr);
          let ret;
          if (isX(M)) {
            ret = "";
          } else if (isX(m)) {
            ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
          } else if (isX(p)) {
            ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
          } else if (pr) {
            debug("replaceTilde pr", pr);
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
          }
          debug("tilde return", ret);
          return ret;
        });
      };
      var replaceCarets = (comp, options) => {
        return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
      };
      var replaceCaret = (comp, options) => {
        debug("caret", comp, options);
        const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
        const z = options.includePrerelease ? "-0" : "";
        return comp.replace(r, (_, M, m, p, pr) => {
          debug("caret", comp, _, M, m, p, pr);
          let ret;
          if (isX(M)) {
            ret = "";
          } else if (isX(m)) {
            ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
          } else if (isX(p)) {
            if (M === "0") {
              ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
            } else {
              ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
            }
          } else if (pr) {
            debug("replaceCaret pr", pr);
            if (M === "0") {
              if (m === "0") {
                ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
              } else {
                ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
              }
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
            }
          } else {
            debug("no pr");
            if (M === "0") {
              if (m === "0") {
                ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
              } else {
                ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
              }
            } else {
              ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
            }
          }
          debug("caret return", ret);
          return ret;
        });
      };
      var replaceXRanges = (comp, options) => {
        debug("replaceXRanges", comp, options);
        return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
      };
      var replaceXRange = (comp, options) => {
        comp = comp.trim();
        const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
        return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
          debug("xRange", comp, ret, gtlt, M, m, p, pr);
          const xM = isX(M);
          const xm = xM || isX(m);
          const xp = xm || isX(p);
          const anyX = xp;
          if (gtlt === "=" && anyX) {
            gtlt = "";
          }
          pr = options.includePrerelease ? "-0" : "";
          if (xM) {
            if (gtlt === ">" || gtlt === "<") {
              ret = "<0.0.0-0";
            } else {
              ret = "*";
            }
          } else if (gtlt && anyX) {
            if (xm) {
              m = 0;
            }
            p = 0;
            if (gtlt === ">") {
              gtlt = ">=";
              if (xm) {
                M = +M + 1;
                m = 0;
                p = 0;
              } else {
                m = +m + 1;
                p = 0;
              }
            } else if (gtlt === "<=") {
              gtlt = "<";
              if (xm) {
                M = +M + 1;
              } else {
                m = +m + 1;
              }
            }
            if (gtlt === "<") {
              pr = "-0";
            }
            ret = `${gtlt + M}.${m}.${p}${pr}`;
          } else if (xm) {
            ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
          } else if (xp) {
            ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
          }
          debug("xRange return", ret);
          return ret;
        });
      };
      var replaceStars = (comp, options) => {
        debug("replaceStars", comp, options);
        return comp.trim().replace(re[t.STAR], "");
      };
      var replaceGTE0 = (comp, options) => {
        debug("replaceGTE0", comp, options);
        return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
      };
      var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
        if (isX(fM)) {
          from = "";
        } else if (isX(fm)) {
          from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
        } else if (isX(fp)) {
          from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
        } else if (fpr) {
          from = `>=${from}`;
        } else {
          from = `>=${from}${incPr ? "-0" : ""}`;
        }
        if (isX(tM)) {
          to = "";
        } else if (isX(tm)) {
          to = `<${+tM + 1}.0.0-0`;
        } else if (isX(tp)) {
          to = `<${tM}.${+tm + 1}.0-0`;
        } else if (tpr) {
          to = `<=${tM}.${tm}.${tp}-${tpr}`;
        } else if (incPr) {
          to = `<${tM}.${tm}.${+tp + 1}-0`;
        } else {
          to = `<=${to}`;
        }
        return `${from} ${to}`.trim();
      };
      var testSet = (set, version, options) => {
        for (let i = 0; i < set.length; i++) {
          if (!set[i].test(version)) {
            return false;
          }
        }
        if (version.prerelease.length && !options.includePrerelease) {
          for (let i = 0; i < set.length; i++) {
            debug(set[i].semver);
            if (set[i].semver === Comparator.ANY) {
              continue;
            }
            if (set[i].semver.prerelease.length > 0) {
              const allowed = set[i].semver;
              if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
                return true;
              }
            }
          }
          return false;
        }
        return true;
      };
    }
  });

  // node_modules/semver/classes/comparator.js
  var require_comparator = __commonJS({
    "node_modules/semver/classes/comparator.js"(exports, module) {
      "use strict";
      var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
      var Comparator = class _Comparator {
        static get ANY() {
          return ANY;
        }
        constructor(comp, options) {
          options = parseOptions(options);
          if (comp instanceof _Comparator) {
            if (comp.loose === !!options.loose) {
              return comp;
            } else {
              comp = comp.value;
            }
          }
          comp = comp.trim().split(/\s+/).join(" ");
          debug("comparator", comp, options);
          this.options = options;
          this.loose = !!options.loose;
          this.parse(comp);
          if (this.semver === ANY) {
            this.value = "";
          } else {
            this.value = this.operator + this.semver.version;
          }
          debug("comp", this);
        }
        parse(comp) {
          const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
          const m = comp.match(r);
          if (!m) {
            throw new TypeError(`Invalid comparator: ${comp}`);
          }
          this.operator = m[1] !== void 0 ? m[1] : "";
          if (this.operator === "=") {
            this.operator = "";
          }
          if (!m[2]) {
            this.semver = ANY;
          } else {
            this.semver = new SemVer(m[2], this.options.loose);
          }
        }
        toString() {
          return this.value;
        }
        test(version) {
          debug("Comparator.test", version, this.options.loose);
          if (this.semver === ANY || version === ANY) {
            return true;
          }
          if (typeof version === "string") {
            try {
              version = new SemVer(version, this.options);
            } catch (er) {
              return false;
            }
          }
          return cmp(version, this.operator, this.semver, this.options);
        }
        intersects(comp, options) {
          if (!(comp instanceof _Comparator)) {
            throw new TypeError("a Comparator is required");
          }
          if (this.operator === "") {
            if (this.value === "") {
              return true;
            }
            return new Range(comp.value, options).test(this.value);
          } else if (comp.operator === "") {
            if (comp.value === "") {
              return true;
            }
            return new Range(this.value, options).test(comp.semver);
          }
          options = parseOptions(options);
          if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
            return false;
          }
          if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
            return false;
          }
          if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
            return true;
          }
          if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
            return true;
          }
          if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
            return true;
          }
          if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
            return true;
          }
          if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
            return true;
          }
          return false;
        }
      };
      module.exports = Comparator;
      var parseOptions = require_parse_options();
      var { safeRe: re, t } = require_re();
      var cmp = require_cmp();
      var debug = require_debug();
      var SemVer = require_semver();
      var Range = require_range();
    }
  });

  // node_modules/semver/functions/satisfies.js
  var require_satisfies = __commonJS({
    "node_modules/semver/functions/satisfies.js"(exports, module) {
      "use strict";
      var Range = require_range();
      var satisfies = (version, range, options) => {
        try {
          range = new Range(range, options);
        } catch (er) {
          return false;
        }
        return range.test(version);
      };
      module.exports = satisfies;
    }
  });

  // node_modules/semver/ranges/to-comparators.js
  var require_to_comparators = __commonJS({
    "node_modules/semver/ranges/to-comparators.js"(exports, module) {
      "use strict";
      var Range = require_range();
      var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
      module.exports = toComparators;
    }
  });

  // node_modules/semver/ranges/max-satisfying.js
  var require_max_satisfying = __commonJS({
    "node_modules/semver/ranges/max-satisfying.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var Range = require_range();
      var maxSatisfying = (versions, range, options) => {
        let max = null;
        let maxSV = null;
        let rangeObj = null;
        try {
          rangeObj = new Range(range, options);
        } catch (er) {
          return null;
        }
        versions.forEach((v) => {
          if (rangeObj.test(v)) {
            if (!max || maxSV.compare(v) === -1) {
              max = v;
              maxSV = new SemVer(max, options);
            }
          }
        });
        return max;
      };
      module.exports = maxSatisfying;
    }
  });

  // node_modules/semver/ranges/min-satisfying.js
  var require_min_satisfying = __commonJS({
    "node_modules/semver/ranges/min-satisfying.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var Range = require_range();
      var minSatisfying = (versions, range, options) => {
        let min = null;
        let minSV = null;
        let rangeObj = null;
        try {
          rangeObj = new Range(range, options);
        } catch (er) {
          return null;
        }
        versions.forEach((v) => {
          if (rangeObj.test(v)) {
            if (!min || minSV.compare(v) === 1) {
              min = v;
              minSV = new SemVer(min, options);
            }
          }
        });
        return min;
      };
      module.exports = minSatisfying;
    }
  });

  // node_modules/semver/ranges/min-version.js
  var require_min_version = __commonJS({
    "node_modules/semver/ranges/min-version.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var Range = require_range();
      var gt = require_gt();
      var minVersion = (range, loose) => {
        range = new Range(range, loose);
        let minver = new SemVer("0.0.0");
        if (range.test(minver)) {
          return minver;
        }
        minver = new SemVer("0.0.0-0");
        if (range.test(minver)) {
          return minver;
        }
        minver = null;
        for (let i = 0; i < range.set.length; ++i) {
          const comparators = range.set[i];
          let setMin = null;
          comparators.forEach((comparator) => {
            const compver = new SemVer(comparator.semver.version);
            switch (comparator.operator) {
              case ">":
                if (compver.prerelease.length === 0) {
                  compver.patch++;
                } else {
                  compver.prerelease.push(0);
                }
                compver.raw = compver.format();
              /* fallthrough */
              case "":
              case ">=":
                if (!setMin || gt(compver, setMin)) {
                  setMin = compver;
                }
                break;
              case "<":
              case "<=":
                break;
              /* istanbul ignore next */
              default:
                throw new Error(`Unexpected operation: ${comparator.operator}`);
            }
          });
          if (setMin && (!minver || gt(minver, setMin))) {
            minver = setMin;
          }
        }
        if (minver && range.test(minver)) {
          return minver;
        }
        return null;
      };
      module.exports = minVersion;
    }
  });

  // node_modules/semver/ranges/valid.js
  var require_valid2 = __commonJS({
    "node_modules/semver/ranges/valid.js"(exports, module) {
      "use strict";
      var Range = require_range();
      var validRange = (range, options) => {
        try {
          return new Range(range, options).range || "*";
        } catch (er) {
          return null;
        }
      };
      module.exports = validRange;
    }
  });

  // node_modules/semver/ranges/outside.js
  var require_outside = __commonJS({
    "node_modules/semver/ranges/outside.js"(exports, module) {
      "use strict";
      var SemVer = require_semver();
      var Comparator = require_comparator();
      var { ANY } = Comparator;
      var Range = require_range();
      var satisfies = require_satisfies();
      var gt = require_gt();
      var lt = require_lt();
      var lte = require_lte();
      var gte = require_gte();
      var outside = (version, range, hilo, options) => {
        version = new SemVer(version, options);
        range = new Range(range, options);
        let gtfn, ltefn, ltfn, comp, ecomp;
        switch (hilo) {
          case ">":
            gtfn = gt;
            ltefn = lte;
            ltfn = lt;
            comp = ">";
            ecomp = ">=";
            break;
          case "<":
            gtfn = lt;
            ltefn = gte;
            ltfn = gt;
            comp = "<";
            ecomp = "<=";
            break;
          default:
            throw new TypeError('Must provide a hilo val of "<" or ">"');
        }
        if (satisfies(version, range, options)) {
          return false;
        }
        for (let i = 0; i < range.set.length; ++i) {
          const comparators = range.set[i];
          let high = null;
          let low = null;
          comparators.forEach((comparator) => {
            if (comparator.semver === ANY) {
              comparator = new Comparator(">=0.0.0");
            }
            high = high || comparator;
            low = low || comparator;
            if (gtfn(comparator.semver, high.semver, options)) {
              high = comparator;
            } else if (ltfn(comparator.semver, low.semver, options)) {
              low = comparator;
            }
          });
          if (high.operator === comp || high.operator === ecomp) {
            return false;
          }
          if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
            return false;
          } else if (low.operator === ecomp && ltfn(version, low.semver)) {
            return false;
          }
        }
        return true;
      };
      module.exports = outside;
    }
  });

  // node_modules/semver/ranges/gtr.js
  var require_gtr = __commonJS({
    "node_modules/semver/ranges/gtr.js"(exports, module) {
      "use strict";
      var outside = require_outside();
      var gtr = (version, range, options) => outside(version, range, ">", options);
      module.exports = gtr;
    }
  });

  // node_modules/semver/ranges/ltr.js
  var require_ltr = __commonJS({
    "node_modules/semver/ranges/ltr.js"(exports, module) {
      "use strict";
      var outside = require_outside();
      var ltr = (version, range, options) => outside(version, range, "<", options);
      module.exports = ltr;
    }
  });

  // node_modules/semver/ranges/intersects.js
  var require_intersects = __commonJS({
    "node_modules/semver/ranges/intersects.js"(exports, module) {
      "use strict";
      var Range = require_range();
      var intersects = (r1, r2, options) => {
        r1 = new Range(r1, options);
        r2 = new Range(r2, options);
        return r1.intersects(r2, options);
      };
      module.exports = intersects;
    }
  });

  // node_modules/semver/ranges/simplify.js
  var require_simplify = __commonJS({
    "node_modules/semver/ranges/simplify.js"(exports, module) {
      "use strict";
      var satisfies = require_satisfies();
      var compare = require_compare();
      module.exports = (versions, range, options) => {
        const set = [];
        let first = null;
        let prev = null;
        const v = versions.sort((a, b) => compare(a, b, options));
        for (const version of v) {
          const included = satisfies(version, range, options);
          if (included) {
            prev = version;
            if (!first) {
              first = version;
            }
          } else {
            if (prev) {
              set.push([first, prev]);
            }
            prev = null;
            first = null;
          }
        }
        if (first) {
          set.push([first, null]);
        }
        const ranges = [];
        for (const [min, max] of set) {
          if (min === max) {
            ranges.push(min);
          } else if (!max && min === v[0]) {
            ranges.push("*");
          } else if (!max) {
            ranges.push(`>=${min}`);
          } else if (min === v[0]) {
            ranges.push(`<=${max}`);
          } else {
            ranges.push(`${min} - ${max}`);
          }
        }
        const simplified = ranges.join(" || ");
        const original = typeof range.raw === "string" ? range.raw : String(range);
        return simplified.length < original.length ? simplified : range;
      };
    }
  });

  // node_modules/semver/ranges/subset.js
  var require_subset = __commonJS({
    "node_modules/semver/ranges/subset.js"(exports, module) {
      "use strict";
      var Range = require_range();
      var Comparator = require_comparator();
      var { ANY } = Comparator;
      var satisfies = require_satisfies();
      var compare = require_compare();
      var subset = (sub, dom, options = {}) => {
        if (sub === dom) {
          return true;
        }
        sub = new Range(sub, options);
        dom = new Range(dom, options);
        let sawNonNull = false;
        OUTER: for (const simpleSub of sub.set) {
          for (const simpleDom of dom.set) {
            const isSub = simpleSubset(simpleSub, simpleDom, options);
            sawNonNull = sawNonNull || isSub !== null;
            if (isSub) {
              continue OUTER;
            }
          }
          if (sawNonNull) {
            return false;
          }
        }
        return true;
      };
      var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
      var minimumVersion = [new Comparator(">=0.0.0")];
      var simpleSubset = (sub, dom, options) => {
        if (sub === dom) {
          return true;
        }
        if (sub.length === 1 && sub[0].semver === ANY) {
          if (dom.length === 1 && dom[0].semver === ANY) {
            return true;
          } else if (options.includePrerelease) {
            sub = minimumVersionWithPreRelease;
          } else {
            sub = minimumVersion;
          }
        }
        if (dom.length === 1 && dom[0].semver === ANY) {
          if (options.includePrerelease) {
            return true;
          } else {
            dom = minimumVersion;
          }
        }
        const eqSet = /* @__PURE__ */ new Set();
        let gt, lt;
        for (const c of sub) {
          if (c.operator === ">" || c.operator === ">=") {
            gt = higherGT(gt, c, options);
          } else if (c.operator === "<" || c.operator === "<=") {
            lt = lowerLT(lt, c, options);
          } else {
            eqSet.add(c.semver);
          }
        }
        if (eqSet.size > 1) {
          return null;
        }
        let gtltComp;
        if (gt && lt) {
          gtltComp = compare(gt.semver, lt.semver, options);
          if (gtltComp > 0) {
            return null;
          } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
            return null;
          }
        }
        for (const eq of eqSet) {
          if (gt && !satisfies(eq, String(gt), options)) {
            return null;
          }
          if (lt && !satisfies(eq, String(lt), options)) {
            return null;
          }
          for (const c of dom) {
            if (!satisfies(eq, String(c), options)) {
              return false;
            }
          }
          return true;
        }
        let higher, lower;
        let hasDomLT, hasDomGT;
        let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
        let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
        if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
          needDomLTPre = false;
        }
        for (const c of dom) {
          hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
          hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
          if (gt) {
            if (needDomGTPre) {
              if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
                needDomGTPre = false;
              }
            }
            if (c.operator === ">" || c.operator === ">=") {
              higher = higherGT(gt, c, options);
              if (higher === c && higher !== gt) {
                return false;
              }
            } else if (gt.operator === ">=" && !satisfies(gt.semver, String(c), options)) {
              return false;
            }
          }
          if (lt) {
            if (needDomLTPre) {
              if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
                needDomLTPre = false;
              }
            }
            if (c.operator === "<" || c.operator === "<=") {
              lower = lowerLT(lt, c, options);
              if (lower === c && lower !== lt) {
                return false;
              }
            } else if (lt.operator === "<=" && !satisfies(lt.semver, String(c), options)) {
              return false;
            }
          }
          if (!c.operator && (lt || gt) && gtltComp !== 0) {
            return false;
          }
        }
        if (gt && hasDomLT && !lt && gtltComp !== 0) {
          return false;
        }
        if (lt && hasDomGT && !gt && gtltComp !== 0) {
          return false;
        }
        if (needDomGTPre || needDomLTPre) {
          return false;
        }
        return true;
      };
      var higherGT = (a, b, options) => {
        if (!a) {
          return b;
        }
        const comp = compare(a.semver, b.semver, options);
        return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
      };
      var lowerLT = (a, b, options) => {
        if (!a) {
          return b;
        }
        const comp = compare(a.semver, b.semver, options);
        return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
      };
      module.exports = subset;
    }
  });

  // node_modules/semver/index.js
  var require_semver2 = __commonJS({
    "node_modules/semver/index.js"(exports, module) {
      "use strict";
      var internalRe = require_re();
      var constants = require_constants();
      var SemVer = require_semver();
      var identifiers = require_identifiers();
      var parse = require_parse();
      var valid = require_valid();
      var clean = require_clean();
      var inc = require_inc();
      var diff = require_diff();
      var major = require_major();
      var minor = require_minor();
      var patch = require_patch();
      var prerelease = require_prerelease();
      var compare = require_compare();
      var rcompare = require_rcompare();
      var compareLoose = require_compare_loose();
      var compareBuild = require_compare_build();
      var sort = require_sort();
      var rsort = require_rsort();
      var gt = require_gt();
      var lt = require_lt();
      var eq = require_eq();
      var neq = require_neq();
      var gte = require_gte();
      var lte = require_lte();
      var cmp = require_cmp();
      var coerce = require_coerce();
      var truncate = require_truncate();
      var Comparator = require_comparator();
      var Range = require_range();
      var satisfies = require_satisfies();
      var toComparators = require_to_comparators();
      var maxSatisfying = require_max_satisfying();
      var minSatisfying = require_min_satisfying();
      var minVersion = require_min_version();
      var validRange = require_valid2();
      var outside = require_outside();
      var gtr = require_gtr();
      var ltr = require_ltr();
      var intersects = require_intersects();
      var simplifyRange = require_simplify();
      var subset = require_subset();
      module.exports = {
        parse,
        valid,
        clean,
        inc,
        diff,
        major,
        minor,
        patch,
        prerelease,
        compare,
        rcompare,
        compareLoose,
        compareBuild,
        sort,
        rsort,
        gt,
        lt,
        eq,
        neq,
        gte,
        lte,
        cmp,
        coerce,
        truncate,
        Comparator,
        Range,
        satisfies,
        toComparators,
        maxSatisfying,
        minSatisfying,
        minVersion,
        validRange,
        outside,
        gtr,
        ltr,
        intersects,
        simplifyRange,
        subset,
        SemVer,
        re: internalRe.re,
        src: internalRe.src,
        tokens: internalRe.t,
        SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
        RELEASE_TYPES: constants.RELEASE_TYPES,
        compareIdentifiers: identifiers.compareIdentifiers,
        rcompareIdentifiers: identifiers.rcompareIdentifiers
      };
    }
  });

  // node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js
  var require_asymmetricKeyDetailsSupported = __commonJS({
    "node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js"(exports, module) {
      var semver = require_semver2();
      module.exports = semver.satisfies(process.version, ">=15.7.0");
    }
  });

  // node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js
  var require_rsaPssKeyDetailsSupported = __commonJS({
    "node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js"(exports, module) {
      var semver = require_semver2();
      module.exports = semver.satisfies(process.version, ">=16.9.0");
    }
  });

  // node_modules/jsonwebtoken/lib/validateAsymmetricKey.js
  var require_validateAsymmetricKey = __commonJS({
    "node_modules/jsonwebtoken/lib/validateAsymmetricKey.js"(exports, module) {
      var ASYMMETRIC_KEY_DETAILS_SUPPORTED = require_asymmetricKeyDetailsSupported();
      var RSA_PSS_KEY_DETAILS_SUPPORTED = require_rsaPssKeyDetailsSupported();
      var allowedAlgorithmsForKeys = {
        "ec": ["ES256", "ES384", "ES512"],
        "rsa": ["RS256", "PS256", "RS384", "PS384", "RS512", "PS512"],
        "rsa-pss": ["PS256", "PS384", "PS512"]
      };
      var allowedCurves = {
        ES256: "prime256v1",
        ES384: "secp384r1",
        ES512: "secp521r1"
      };
      module.exports = function(algorithm, key) {
        if (!algorithm || !key) return;
        const keyType = key.asymmetricKeyType;
        if (!keyType) return;
        const allowedAlgorithms = allowedAlgorithmsForKeys[keyType];
        if (!allowedAlgorithms) {
          throw new Error(`Unknown key type "${keyType}".`);
        }
        if (!allowedAlgorithms.includes(algorithm)) {
          throw new Error(`"alg" parameter for "${keyType}" key type must be one of: ${allowedAlgorithms.join(", ")}.`);
        }
        if (ASYMMETRIC_KEY_DETAILS_SUPPORTED) {
          switch (keyType) {
            case "ec":
              const keyCurve = key.asymmetricKeyDetails.namedCurve;
              const allowedCurve = allowedCurves[algorithm];
              if (keyCurve !== allowedCurve) {
                throw new Error(`"alg" parameter "${algorithm}" requires curve "${allowedCurve}".`);
              }
              break;
            case "rsa-pss":
              if (RSA_PSS_KEY_DETAILS_SUPPORTED) {
                const length = parseInt(algorithm.slice(-3), 10);
                const { hashAlgorithm, mgf1HashAlgorithm, saltLength } = key.asymmetricKeyDetails;
                if (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm) {
                  throw new Error(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${algorithm}.`);
                }
                if (saltLength !== void 0 && saltLength > length >> 3) {
                  throw new Error(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${algorithm}.`);
                }
              }
              break;
          }
        }
      };
    }
  });

  // node_modules/jsonwebtoken/lib/psSupported.js
  var require_psSupported = __commonJS({
    "node_modules/jsonwebtoken/lib/psSupported.js"(exports, module) {
      var semver = require_semver2();
      module.exports = semver.satisfies(process.version, "^6.12.0 || >=8.0.0");
    }
  });

  // node_modules/jsonwebtoken/verify.js
  var require_verify = __commonJS({
    "node_modules/jsonwebtoken/verify.js"(exports, module) {
      var JsonWebTokenError = require_JsonWebTokenError();
      var NotBeforeError = require_NotBeforeError();
      var TokenExpiredError = require_TokenExpiredError();
      var decode = require_decode();
      var timespan = require_timespan();
      var validateAsymmetricKey = require_validateAsymmetricKey();
      var PS_SUPPORTED = require_psSupported();
      var jws = require_jws();
      var { KeyObject, createSecretKey, createPublicKey } = __require("crypto");
      var PUB_KEY_ALGS = ["RS256", "RS384", "RS512"];
      var EC_KEY_ALGS = ["ES256", "ES384", "ES512"];
      var RSA_KEY_ALGS = ["RS256", "RS384", "RS512"];
      var HS_ALGS = ["HS256", "HS384", "HS512"];
      if (PS_SUPPORTED) {
        PUB_KEY_ALGS.splice(PUB_KEY_ALGS.length, 0, "PS256", "PS384", "PS512");
        RSA_KEY_ALGS.splice(RSA_KEY_ALGS.length, 0, "PS256", "PS384", "PS512");
      }
      module.exports = function(jwtString, secretOrPublicKey, options, callback) {
        if (typeof options === "function" && !callback) {
          callback = options;
          options = {};
        }
        if (!options) {
          options = {};
        }
        options = Object.assign({}, options);
        let done;
        if (callback) {
          done = callback;
        } else {
          done = function(err, data) {
            if (err) throw err;
            return data;
          };
        }
        if (options.clockTimestamp && typeof options.clockTimestamp !== "number") {
          return done(new JsonWebTokenError("clockTimestamp must be a number"));
        }
        if (options.nonce !== void 0 && (typeof options.nonce !== "string" || options.nonce.trim() === "")) {
          return done(new JsonWebTokenError("nonce must be a non-empty string"));
        }
        if (options.allowInvalidAsymmetricKeyTypes !== void 0 && typeof options.allowInvalidAsymmetricKeyTypes !== "boolean") {
          return done(new JsonWebTokenError("allowInvalidAsymmetricKeyTypes must be a boolean"));
        }
        const clockTimestamp = options.clockTimestamp || Math.floor(Date.now() / 1e3);
        if (!jwtString) {
          return done(new JsonWebTokenError("jwt must be provided"));
        }
        if (typeof jwtString !== "string") {
          return done(new JsonWebTokenError("jwt must be a string"));
        }
        const parts = jwtString.split(".");
        if (parts.length !== 3) {
          return done(new JsonWebTokenError("jwt malformed"));
        }
        let decodedToken;
        try {
          decodedToken = decode(jwtString, { complete: true });
        } catch (err) {
          return done(err);
        }
        if (!decodedToken) {
          return done(new JsonWebTokenError("invalid token"));
        }
        const header = decodedToken.header;
        let getSecret;
        if (typeof secretOrPublicKey === "function") {
          if (!callback) {
            return done(new JsonWebTokenError("verify must be called asynchronous if secret or public key is provided as a callback"));
          }
          getSecret = secretOrPublicKey;
        } else {
          getSecret = function(header2, secretCallback) {
            return secretCallback(null, secretOrPublicKey);
          };
        }
        return getSecret(header, function(err, secretOrPublicKey2) {
          if (err) {
            return done(new JsonWebTokenError("error in secret or public key callback: " + err.message));
          }
          const hasSignature = parts[2].trim() !== "";
          if (!hasSignature && secretOrPublicKey2) {
            return done(new JsonWebTokenError("jwt signature is required"));
          }
          if (hasSignature && !secretOrPublicKey2) {
            return done(new JsonWebTokenError("secret or public key must be provided"));
          }
          if (!hasSignature && !options.algorithms) {
            return done(new JsonWebTokenError('please specify "none" in "algorithms" to verify unsigned tokens'));
          }
          if (secretOrPublicKey2 != null && !(secretOrPublicKey2 instanceof KeyObject)) {
            try {
              secretOrPublicKey2 = createPublicKey(secretOrPublicKey2);
            } catch (_) {
              try {
                secretOrPublicKey2 = createSecretKey(typeof secretOrPublicKey2 === "string" ? Buffer.from(secretOrPublicKey2) : secretOrPublicKey2);
              } catch (_2) {
                return done(new JsonWebTokenError("secretOrPublicKey is not valid key material"));
              }
            }
          }
          if (!options.algorithms) {
            if (secretOrPublicKey2.type === "secret") {
              options.algorithms = HS_ALGS;
            } else if (["rsa", "rsa-pss"].includes(secretOrPublicKey2.asymmetricKeyType)) {
              options.algorithms = RSA_KEY_ALGS;
            } else if (secretOrPublicKey2.asymmetricKeyType === "ec") {
              options.algorithms = EC_KEY_ALGS;
            } else {
              options.algorithms = PUB_KEY_ALGS;
            }
          }
          if (options.algorithms.indexOf(decodedToken.header.alg) === -1) {
            return done(new JsonWebTokenError("invalid algorithm"));
          }
          if (header.alg.startsWith("HS") && secretOrPublicKey2.type !== "secret") {
            return done(new JsonWebTokenError(`secretOrPublicKey must be a symmetric key when using ${header.alg}`));
          } else if (/^(?:RS|PS|ES)/.test(header.alg) && secretOrPublicKey2.type !== "public") {
            return done(new JsonWebTokenError(`secretOrPublicKey must be an asymmetric key when using ${header.alg}`));
          }
          if (!options.allowInvalidAsymmetricKeyTypes) {
            try {
              validateAsymmetricKey(header.alg, secretOrPublicKey2);
            } catch (e) {
              return done(e);
            }
          }
          let valid;
          try {
            valid = jws.verify(jwtString, decodedToken.header.alg, secretOrPublicKey2);
          } catch (e) {
            return done(e);
          }
          if (!valid) {
            return done(new JsonWebTokenError("invalid signature"));
          }
          const payload = decodedToken.payload;
          if (typeof payload.nbf !== "undefined" && !options.ignoreNotBefore) {
            if (typeof payload.nbf !== "number") {
              return done(new JsonWebTokenError("invalid nbf value"));
            }
            if (payload.nbf > clockTimestamp + (options.clockTolerance || 0)) {
              return done(new NotBeforeError("jwt not active", new Date(payload.nbf * 1e3)));
            }
          }
          if (typeof payload.exp !== "undefined" && !options.ignoreExpiration) {
            if (typeof payload.exp !== "number") {
              return done(new JsonWebTokenError("invalid exp value"));
            }
            if (clockTimestamp >= payload.exp + (options.clockTolerance || 0)) {
              return done(new TokenExpiredError("jwt expired", new Date(payload.exp * 1e3)));
            }
          }
          if (options.audience) {
            const audiences = Array.isArray(options.audience) ? options.audience : [options.audience];
            const target = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
            const match = target.some(function(targetAudience) {
              return audiences.some(function(audience) {
                return audience instanceof RegExp ? audience.test(targetAudience) : audience === targetAudience;
              });
            });
            if (!match) {
              return done(new JsonWebTokenError("jwt audience invalid. expected: " + audiences.join(" or ")));
            }
          }
          if (options.issuer) {
            const invalid_issuer = typeof options.issuer === "string" && payload.iss !== options.issuer || Array.isArray(options.issuer) && options.issuer.indexOf(payload.iss) === -1;
            if (invalid_issuer) {
              return done(new JsonWebTokenError("jwt issuer invalid. expected: " + options.issuer));
            }
          }
          if (options.subject) {
            if (payload.sub !== options.subject) {
              return done(new JsonWebTokenError("jwt subject invalid. expected: " + options.subject));
            }
          }
          if (options.jwtid) {
            if (payload.jti !== options.jwtid) {
              return done(new JsonWebTokenError("jwt jwtid invalid. expected: " + options.jwtid));
            }
          }
          if (options.nonce) {
            if (payload.nonce !== options.nonce) {
              return done(new JsonWebTokenError("jwt nonce invalid. expected: " + options.nonce));
            }
          }
          if (options.maxAge) {
            if (typeof payload.iat !== "number") {
              return done(new JsonWebTokenError("iat required when maxAge is specified"));
            }
            const maxAgeTimestamp = timespan(options.maxAge, payload.iat);
            if (typeof maxAgeTimestamp === "undefined") {
              return done(new JsonWebTokenError('"maxAge" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
            }
            if (clockTimestamp >= maxAgeTimestamp + (options.clockTolerance || 0)) {
              return done(new TokenExpiredError("maxAge exceeded", new Date(maxAgeTimestamp * 1e3)));
            }
          }
          if (options.complete === true) {
            const signature = decodedToken.signature;
            return done(null, {
              header,
              payload,
              signature
            });
          }
          return done(null, payload);
        });
      };
    }
  });

  // node_modules/lodash.includes/index.js
  var require_lodash = __commonJS({
    "node_modules/lodash.includes/index.js"(exports, module) {
      var INFINITY = 1 / 0;
      var MAX_SAFE_INTEGER = 9007199254740991;
      var MAX_INTEGER = 17976931348623157e292;
      var NAN = 0 / 0;
      var argsTag = "[object Arguments]";
      var funcTag = "[object Function]";
      var genTag = "[object GeneratorFunction]";
      var stringTag = "[object String]";
      var symbolTag = "[object Symbol]";
      var reTrim = /^\s+|\s+$/g;
      var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
      var reIsBinary = /^0b[01]+$/i;
      var reIsOctal = /^0o[0-7]+$/i;
      var reIsUint = /^(?:0|[1-9]\d*)$/;
      var freeParseInt = parseInt;
      function arrayMap(array, iteratee) {
        var index = -1, length = array ? array.length : 0, result = Array(length);
        while (++index < length) {
          result[index] = iteratee(array[index], index, array);
        }
        return result;
      }
      function baseFindIndex(array, predicate, fromIndex, fromRight) {
        var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
        while (fromRight ? index-- : ++index < length) {
          if (predicate(array[index], index, array)) {
            return index;
          }
        }
        return -1;
      }
      function baseIndexOf(array, value, fromIndex) {
        if (value !== value) {
          return baseFindIndex(array, baseIsNaN, fromIndex);
        }
        var index = fromIndex - 1, length = array.length;
        while (++index < length) {
          if (array[index] === value) {
            return index;
          }
        }
        return -1;
      }
      function baseIsNaN(value) {
        return value !== value;
      }
      function baseTimes(n, iteratee) {
        var index = -1, result = Array(n);
        while (++index < n) {
          result[index] = iteratee(index);
        }
        return result;
      }
      function baseValues(object, props) {
        return arrayMap(props, function(key) {
          return object[key];
        });
      }
      function overArg(func, transform) {
        return function(arg) {
          return func(transform(arg));
        };
      }
      var objectProto = Object.prototype;
      var hasOwnProperty = objectProto.hasOwnProperty;
      var objectToString = objectProto.toString;
      var propertyIsEnumerable = objectProto.propertyIsEnumerable;
      var nativeKeys = overArg(Object.keys, Object);
      var nativeMax = Math.max;
      function arrayLikeKeys(value, inherited) {
        var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
        var length = result.length, skipIndexes = !!length;
        for (var key in value) {
          if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
            result.push(key);
          }
        }
        return result;
      }
      function baseKeys(object) {
        if (!isPrototype(object)) {
          return nativeKeys(object);
        }
        var result = [];
        for (var key in Object(object)) {
          if (hasOwnProperty.call(object, key) && key != "constructor") {
            result.push(key);
          }
        }
        return result;
      }
      function isIndex(value, length) {
        length = length == null ? MAX_SAFE_INTEGER : length;
        return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
      }
      function isPrototype(value) {
        var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
        return value === proto;
      }
      function includes(collection, value, fromIndex, guard) {
        collection = isArrayLike(collection) ? collection : values(collection);
        fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
        var length = collection.length;
        if (fromIndex < 0) {
          fromIndex = nativeMax(length + fromIndex, 0);
        }
        return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
      }
      function isArguments(value) {
        return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
      }
      var isArray = Array.isArray;
      function isArrayLike(value) {
        return value != null && isLength(value.length) && !isFunction(value);
      }
      function isArrayLikeObject(value) {
        return isObjectLike(value) && isArrayLike(value);
      }
      function isFunction(value) {
        var tag = isObject(value) ? objectToString.call(value) : "";
        return tag == funcTag || tag == genTag;
      }
      function isLength(value) {
        return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
      }
      function isObject(value) {
        var type = typeof value;
        return !!value && (type == "object" || type == "function");
      }
      function isObjectLike(value) {
        return !!value && typeof value == "object";
      }
      function isString(value) {
        return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
      }
      function isSymbol(value) {
        return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
      }
      function toFinite(value) {
        if (!value) {
          return value === 0 ? value : 0;
        }
        value = toNumber(value);
        if (value === INFINITY || value === -INFINITY) {
          var sign = value < 0 ? -1 : 1;
          return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
      }
      function toInteger(value) {
        var result = toFinite(value), remainder = result % 1;
        return result === result ? remainder ? result - remainder : result : 0;
      }
      function toNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol(value)) {
          return NAN;
        }
        if (isObject(value)) {
          var other = typeof value.valueOf == "function" ? value.valueOf() : value;
          value = isObject(other) ? other + "" : other;
        }
        if (typeof value != "string") {
          return value === 0 ? value : +value;
        }
        value = value.replace(reTrim, "");
        var isBinary = reIsBinary.test(value);
        return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
      }
      function keys(object) {
        return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
      }
      function values(object) {
        return object ? baseValues(object, keys(object)) : [];
      }
      module.exports = includes;
    }
  });

  // node_modules/lodash.isboolean/index.js
  var require_lodash2 = __commonJS({
    "node_modules/lodash.isboolean/index.js"(exports, module) {
      var boolTag = "[object Boolean]";
      var objectProto = Object.prototype;
      var objectToString = objectProto.toString;
      function isBoolean(value) {
        return value === true || value === false || isObjectLike(value) && objectToString.call(value) == boolTag;
      }
      function isObjectLike(value) {
        return !!value && typeof value == "object";
      }
      module.exports = isBoolean;
    }
  });

  // node_modules/lodash.isinteger/index.js
  var require_lodash3 = __commonJS({
    "node_modules/lodash.isinteger/index.js"(exports, module) {
      var INFINITY = 1 / 0;
      var MAX_INTEGER = 17976931348623157e292;
      var NAN = 0 / 0;
      var symbolTag = "[object Symbol]";
      var reTrim = /^\s+|\s+$/g;
      var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
      var reIsBinary = /^0b[01]+$/i;
      var reIsOctal = /^0o[0-7]+$/i;
      var freeParseInt = parseInt;
      var objectProto = Object.prototype;
      var objectToString = objectProto.toString;
      function isInteger(value) {
        return typeof value == "number" && value == toInteger(value);
      }
      function isObject(value) {
        var type = typeof value;
        return !!value && (type == "object" || type == "function");
      }
      function isObjectLike(value) {
        return !!value && typeof value == "object";
      }
      function isSymbol(value) {
        return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
      }
      function toFinite(value) {
        if (!value) {
          return value === 0 ? value : 0;
        }
        value = toNumber(value);
        if (value === INFINITY || value === -INFINITY) {
          var sign = value < 0 ? -1 : 1;
          return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
      }
      function toInteger(value) {
        var result = toFinite(value), remainder = result % 1;
        return result === result ? remainder ? result - remainder : result : 0;
      }
      function toNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol(value)) {
          return NAN;
        }
        if (isObject(value)) {
          var other = typeof value.valueOf == "function" ? value.valueOf() : value;
          value = isObject(other) ? other + "" : other;
        }
        if (typeof value != "string") {
          return value === 0 ? value : +value;
        }
        value = value.replace(reTrim, "");
        var isBinary = reIsBinary.test(value);
        return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
      }
      module.exports = isInteger;
    }
  });

  // node_modules/lodash.isnumber/index.js
  var require_lodash4 = __commonJS({
    "node_modules/lodash.isnumber/index.js"(exports, module) {
      var numberTag = "[object Number]";
      var objectProto = Object.prototype;
      var objectToString = objectProto.toString;
      function isObjectLike(value) {
        return !!value && typeof value == "object";
      }
      function isNumber(value) {
        return typeof value == "number" || isObjectLike(value) && objectToString.call(value) == numberTag;
      }
      module.exports = isNumber;
    }
  });

  // node_modules/lodash.isplainobject/index.js
  var require_lodash5 = __commonJS({
    "node_modules/lodash.isplainobject/index.js"(exports, module) {
      var objectTag = "[object Object]";
      function isHostObject(value) {
        var result = false;
        if (value != null && typeof value.toString != "function") {
          try {
            result = !!(value + "");
          } catch (e) {
          }
        }
        return result;
      }
      function overArg(func, transform) {
        return function(arg) {
          return func(transform(arg));
        };
      }
      var funcProto = Function.prototype;
      var objectProto = Object.prototype;
      var funcToString = funcProto.toString;
      var hasOwnProperty = objectProto.hasOwnProperty;
      var objectCtorString = funcToString.call(Object);
      var objectToString = objectProto.toString;
      var getPrototype = overArg(Object.getPrototypeOf, Object);
      function isObjectLike(value) {
        return !!value && typeof value == "object";
      }
      function isPlainObject(value) {
        if (!isObjectLike(value) || objectToString.call(value) != objectTag || isHostObject(value)) {
          return false;
        }
        var proto = getPrototype(value);
        if (proto === null) {
          return true;
        }
        var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
        return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
      }
      module.exports = isPlainObject;
    }
  });

  // node_modules/lodash.isstring/index.js
  var require_lodash6 = __commonJS({
    "node_modules/lodash.isstring/index.js"(exports, module) {
      var stringTag = "[object String]";
      var objectProto = Object.prototype;
      var objectToString = objectProto.toString;
      var isArray = Array.isArray;
      function isObjectLike(value) {
        return !!value && typeof value == "object";
      }
      function isString(value) {
        return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
      }
      module.exports = isString;
    }
  });

  // node_modules/lodash.once/index.js
  var require_lodash7 = __commonJS({
    "node_modules/lodash.once/index.js"(exports, module) {
      var FUNC_ERROR_TEXT = "Expected a function";
      var INFINITY = 1 / 0;
      var MAX_INTEGER = 17976931348623157e292;
      var NAN = 0 / 0;
      var symbolTag = "[object Symbol]";
      var reTrim = /^\s+|\s+$/g;
      var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
      var reIsBinary = /^0b[01]+$/i;
      var reIsOctal = /^0o[0-7]+$/i;
      var freeParseInt = parseInt;
      var objectProto = Object.prototype;
      var objectToString = objectProto.toString;
      function before(n, func) {
        var result;
        if (typeof func != "function") {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
        n = toInteger(n);
        return function() {
          if (--n > 0) {
            result = func.apply(this, arguments);
          }
          if (n <= 1) {
            func = void 0;
          }
          return result;
        };
      }
      function once(func) {
        return before(2, func);
      }
      function isObject(value) {
        var type = typeof value;
        return !!value && (type == "object" || type == "function");
      }
      function isObjectLike(value) {
        return !!value && typeof value == "object";
      }
      function isSymbol(value) {
        return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
      }
      function toFinite(value) {
        if (!value) {
          return value === 0 ? value : 0;
        }
        value = toNumber(value);
        if (value === INFINITY || value === -INFINITY) {
          var sign = value < 0 ? -1 : 1;
          return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
      }
      function toInteger(value) {
        var result = toFinite(value), remainder = result % 1;
        return result === result ? remainder ? result - remainder : result : 0;
      }
      function toNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol(value)) {
          return NAN;
        }
        if (isObject(value)) {
          var other = typeof value.valueOf == "function" ? value.valueOf() : value;
          value = isObject(other) ? other + "" : other;
        }
        if (typeof value != "string") {
          return value === 0 ? value : +value;
        }
        value = value.replace(reTrim, "");
        var isBinary = reIsBinary.test(value);
        return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
      }
      module.exports = once;
    }
  });

  // node_modules/jsonwebtoken/sign.js
  var require_sign = __commonJS({
    "node_modules/jsonwebtoken/sign.js"(exports, module) {
      var timespan = require_timespan();
      var PS_SUPPORTED = require_psSupported();
      var validateAsymmetricKey = require_validateAsymmetricKey();
      var jws = require_jws();
      var includes = require_lodash();
      var isBoolean = require_lodash2();
      var isInteger = require_lodash3();
      var isNumber = require_lodash4();
      var isPlainObject = require_lodash5();
      var isString = require_lodash6();
      var once = require_lodash7();
      var { KeyObject, createSecretKey, createPrivateKey } = __require("crypto");
      var SUPPORTED_ALGS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "HS256", "HS384", "HS512", "none"];
      if (PS_SUPPORTED) {
        SUPPORTED_ALGS.splice(3, 0, "PS256", "PS384", "PS512");
      }
      var sign_options_schema = {
        expiresIn: { isValid: function(value) {
          return isInteger(value) || isString(value) && value;
        }, message: '"expiresIn" should be a number of seconds or string representing a timespan' },
        notBefore: { isValid: function(value) {
          return isInteger(value) || isString(value) && value;
        }, message: '"notBefore" should be a number of seconds or string representing a timespan' },
        audience: { isValid: function(value) {
          return isString(value) || Array.isArray(value);
        }, message: '"audience" must be a string or array' },
        algorithm: { isValid: includes.bind(null, SUPPORTED_ALGS), message: '"algorithm" must be a valid string enum value' },
        header: { isValid: isPlainObject, message: '"header" must be an object' },
        encoding: { isValid: isString, message: '"encoding" must be a string' },
        issuer: { isValid: isString, message: '"issuer" must be a string' },
        subject: { isValid: isString, message: '"subject" must be a string' },
        jwtid: { isValid: isString, message: '"jwtid" must be a string' },
        noTimestamp: { isValid: isBoolean, message: '"noTimestamp" must be a boolean' },
        keyid: { isValid: isString, message: '"keyid" must be a string' },
        mutatePayload: { isValid: isBoolean, message: '"mutatePayload" must be a boolean' },
        allowInsecureKeySizes: { isValid: isBoolean, message: '"allowInsecureKeySizes" must be a boolean' },
        allowInvalidAsymmetricKeyTypes: { isValid: isBoolean, message: '"allowInvalidAsymmetricKeyTypes" must be a boolean' }
      };
      var registered_claims_schema = {
        iat: { isValid: isNumber, message: '"iat" should be a number of seconds' },
        exp: { isValid: isNumber, message: '"exp" should be a number of seconds' },
        nbf: { isValid: isNumber, message: '"nbf" should be a number of seconds' }
      };
      function validate(schema, allowUnknown, object, parameterName) {
        if (!isPlainObject(object)) {
          throw new Error('Expected "' + parameterName + '" to be a plain object.');
        }
        Object.keys(object).forEach(function(key) {
          const validator = schema[key];
          if (!validator) {
            if (!allowUnknown) {
              throw new Error('"' + key + '" is not allowed in "' + parameterName + '"');
            }
            return;
          }
          if (!validator.isValid(object[key])) {
            throw new Error(validator.message);
          }
        });
      }
      function validateOptions(options) {
        return validate(sign_options_schema, false, options, "options");
      }
      function validatePayload(payload) {
        return validate(registered_claims_schema, true, payload, "payload");
      }
      var options_to_payload = {
        "audience": "aud",
        "issuer": "iss",
        "subject": "sub",
        "jwtid": "jti"
      };
      var options_for_objects = [
        "expiresIn",
        "notBefore",
        "noTimestamp",
        "audience",
        "issuer",
        "subject",
        "jwtid"
      ];
      module.exports = function(payload, secretOrPrivateKey, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        } else {
          options = options || {};
        }
        const isObjectPayload = typeof payload === "object" && !Buffer.isBuffer(payload);
        const header = Object.assign({
          alg: options.algorithm || "HS256",
          typ: isObjectPayload ? "JWT" : void 0,
          kid: options.keyid
        }, options.header);
        function failure(err) {
          if (callback) {
            return callback(err);
          }
          throw err;
        }
        if (!secretOrPrivateKey && options.algorithm !== "none") {
          return failure(new Error("secretOrPrivateKey must have a value"));
        }
        if (secretOrPrivateKey != null && !(secretOrPrivateKey instanceof KeyObject)) {
          try {
            secretOrPrivateKey = createPrivateKey(secretOrPrivateKey);
          } catch (_) {
            try {
              secretOrPrivateKey = createSecretKey(typeof secretOrPrivateKey === "string" ? Buffer.from(secretOrPrivateKey) : secretOrPrivateKey);
            } catch (_2) {
              return failure(new Error("secretOrPrivateKey is not valid key material"));
            }
          }
        }
        if (header.alg.startsWith("HS") && secretOrPrivateKey.type !== "secret") {
          return failure(new Error(`secretOrPrivateKey must be a symmetric key when using ${header.alg}`));
        } else if (/^(?:RS|PS|ES)/.test(header.alg)) {
          if (secretOrPrivateKey.type !== "private") {
            return failure(new Error(`secretOrPrivateKey must be an asymmetric key when using ${header.alg}`));
          }
          if (!options.allowInsecureKeySizes && !header.alg.startsWith("ES") && secretOrPrivateKey.asymmetricKeyDetails !== void 0 && //KeyObject.asymmetricKeyDetails is supported in Node 15+
          secretOrPrivateKey.asymmetricKeyDetails.modulusLength < 2048) {
            return failure(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
          }
        }
        if (typeof payload === "undefined") {
          return failure(new Error("payload is required"));
        } else if (isObjectPayload) {
          try {
            validatePayload(payload);
          } catch (error) {
            return failure(error);
          }
          if (!options.mutatePayload) {
            payload = Object.assign({}, payload);
          }
        } else {
          const invalid_options = options_for_objects.filter(function(opt) {
            return typeof options[opt] !== "undefined";
          });
          if (invalid_options.length > 0) {
            return failure(new Error("invalid " + invalid_options.join(",") + " option for " + typeof payload + " payload"));
          }
        }
        if (typeof payload.exp !== "undefined" && typeof options.expiresIn !== "undefined") {
          return failure(new Error('Bad "options.expiresIn" option the payload already has an "exp" property.'));
        }
        if (typeof payload.nbf !== "undefined" && typeof options.notBefore !== "undefined") {
          return failure(new Error('Bad "options.notBefore" option the payload already has an "nbf" property.'));
        }
        try {
          validateOptions(options);
        } catch (error) {
          return failure(error);
        }
        if (!options.allowInvalidAsymmetricKeyTypes) {
          try {
            validateAsymmetricKey(header.alg, secretOrPrivateKey);
          } catch (error) {
            return failure(error);
          }
        }
        const timestamp = payload.iat || Math.floor(Date.now() / 1e3);
        if (options.noTimestamp) {
          delete payload.iat;
        } else if (isObjectPayload) {
          payload.iat = timestamp;
        }
        if (typeof options.notBefore !== "undefined") {
          try {
            payload.nbf = timespan(options.notBefore, timestamp);
          } catch (err) {
            return failure(err);
          }
          if (typeof payload.nbf === "undefined") {
            return failure(new Error('"notBefore" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
          }
        }
        if (typeof options.expiresIn !== "undefined" && typeof payload === "object") {
          try {
            payload.exp = timespan(options.expiresIn, timestamp);
          } catch (err) {
            return failure(err);
          }
          if (typeof payload.exp === "undefined") {
            return failure(new Error('"expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
          }
        }
        Object.keys(options_to_payload).forEach(function(key) {
          const claim = options_to_payload[key];
          if (typeof options[key] !== "undefined") {
            if (typeof payload[claim] !== "undefined") {
              return failure(new Error('Bad "options.' + key + '" option. The payload already has an "' + claim + '" property.'));
            }
            payload[claim] = options[key];
          }
        });
        const encoding = options.encoding || "utf8";
        if (typeof callback === "function") {
          callback = callback && once(callback);
          jws.createSign({
            header,
            privateKey: secretOrPrivateKey,
            payload,
            encoding
          }).once("error", callback).once("done", function(signature) {
            if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
              return callback(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
            }
            callback(null, signature);
          });
        } else {
          let signature = jws.sign({ header, payload, secret: secretOrPrivateKey, encoding });
          if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
            throw new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`);
          }
          return signature;
        }
      };
    }
  });

  // node_modules/jsonwebtoken/index.js
  var require_jsonwebtoken = __commonJS({
    "node_modules/jsonwebtoken/index.js"(exports, module) {
      module.exports = {
        decode: require_decode(),
        verify: require_verify(),
        sign: require_sign(),
        JsonWebTokenError: require_JsonWebTokenError(),
        NotBeforeError: require_NotBeforeError(),
        TokenExpiredError: require_TokenExpiredError()
      };
    }
  });

  // node_modules/uuid/dist/commonjs-browser/rng.js
  var require_rng = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/rng.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = rng;
      var getRandomValues;
      var rnds8 = new Uint8Array(16);
      function rng() {
        if (!getRandomValues) {
          getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
          if (!getRandomValues) {
            throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
          }
        }
        return getRandomValues(rnds8);
      }
    }
  });

  // node_modules/uuid/dist/commonjs-browser/regex.js
  var require_regex = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/regex.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/validate.js
  var require_validate = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/validate.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _regex = _interopRequireDefault(require_regex());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function validate(uuid) {
        return typeof uuid === "string" && _regex.default.test(uuid);
      }
      var _default = validate;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/stringify.js
  var require_stringify = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/stringify.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      exports.unsafeStringify = unsafeStringify;
      var _validate = _interopRequireDefault(require_validate());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var byteToHex = [];
      for (let i = 0; i < 256; ++i) {
        byteToHex.push((i + 256).toString(16).slice(1));
      }
      function unsafeStringify(arr, offset = 0) {
        return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
      }
      function stringify(arr, offset = 0) {
        const uuid = unsafeStringify(arr, offset);
        if (!(0, _validate.default)(uuid)) {
          throw TypeError("Stringified UUID is invalid");
        }
        return uuid;
      }
      var _default = stringify;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/v1.js
  var require_v1 = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/v1.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _rng = _interopRequireDefault(require_rng());
      var _stringify = require_stringify();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var _nodeId;
      var _clockseq;
      var _lastMSecs = 0;
      var _lastNSecs = 0;
      function v1(options, buf, offset) {
        let i = buf && offset || 0;
        const b = buf || new Array(16);
        options = options || {};
        let node = options.node || _nodeId;
        let clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
        if (node == null || clockseq == null) {
          const seedBytes = options.random || (options.rng || _rng.default)();
          if (node == null) {
            node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
          }
          if (clockseq == null) {
            clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
          }
        }
        let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
        let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
        const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
        if (dt < 0 && options.clockseq === void 0) {
          clockseq = clockseq + 1 & 16383;
        }
        if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
          nsecs = 0;
        }
        if (nsecs >= 1e4) {
          throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
        }
        _lastMSecs = msecs;
        _lastNSecs = nsecs;
        _clockseq = clockseq;
        msecs += 122192928e5;
        const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
        b[i++] = tl >>> 24 & 255;
        b[i++] = tl >>> 16 & 255;
        b[i++] = tl >>> 8 & 255;
        b[i++] = tl & 255;
        const tmh = msecs / 4294967296 * 1e4 & 268435455;
        b[i++] = tmh >>> 8 & 255;
        b[i++] = tmh & 255;
        b[i++] = tmh >>> 24 & 15 | 16;
        b[i++] = tmh >>> 16 & 255;
        b[i++] = clockseq >>> 8 | 128;
        b[i++] = clockseq & 255;
        for (let n = 0; n < 6; ++n) {
          b[i + n] = node[n];
        }
        return buf || (0, _stringify.unsafeStringify)(b);
      }
      var _default = v1;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/parse.js
  var require_parse2 = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/parse.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _validate = _interopRequireDefault(require_validate());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function parse(uuid) {
        if (!(0, _validate.default)(uuid)) {
          throw TypeError("Invalid UUID");
        }
        let v;
        const arr = new Uint8Array(16);
        arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
        arr[1] = v >>> 16 & 255;
        arr[2] = v >>> 8 & 255;
        arr[3] = v & 255;
        arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
        arr[5] = v & 255;
        arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
        arr[7] = v & 255;
        arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
        arr[9] = v & 255;
        arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
        arr[11] = v / 4294967296 & 255;
        arr[12] = v >>> 24 & 255;
        arr[13] = v >>> 16 & 255;
        arr[14] = v >>> 8 & 255;
        arr[15] = v & 255;
        return arr;
      }
      var _default = parse;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/v35.js
  var require_v35 = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/v35.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.URL = exports.DNS = void 0;
      exports.default = v35;
      var _stringify = require_stringify();
      var _parse = _interopRequireDefault(require_parse2());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function stringToBytes(str) {
        str = unescape(encodeURIComponent(str));
        const bytes = [];
        for (let i = 0; i < str.length; ++i) {
          bytes.push(str.charCodeAt(i));
        }
        return bytes;
      }
      var DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
      exports.DNS = DNS;
      var URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
      exports.URL = URL;
      function v35(name, version, hashfunc) {
        function generateUUID(value, namespace, buf, offset) {
          var _namespace;
          if (typeof value === "string") {
            value = stringToBytes(value);
          }
          if (typeof namespace === "string") {
            namespace = (0, _parse.default)(namespace);
          }
          if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
            throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
          }
          let bytes = new Uint8Array(16 + value.length);
          bytes.set(namespace);
          bytes.set(value, namespace.length);
          bytes = hashfunc(bytes);
          bytes[6] = bytes[6] & 15 | version;
          bytes[8] = bytes[8] & 63 | 128;
          if (buf) {
            offset = offset || 0;
            for (let i = 0; i < 16; ++i) {
              buf[offset + i] = bytes[i];
            }
            return buf;
          }
          return (0, _stringify.unsafeStringify)(bytes);
        }
        try {
          generateUUID.name = name;
        } catch (err) {
        }
        generateUUID.DNS = DNS;
        generateUUID.URL = URL;
        return generateUUID;
      }
    }
  });

  // node_modules/uuid/dist/commonjs-browser/md5.js
  var require_md5 = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/md5.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      function md5(bytes) {
        if (typeof bytes === "string") {
          const msg = unescape(encodeURIComponent(bytes));
          bytes = new Uint8Array(msg.length);
          for (let i = 0; i < msg.length; ++i) {
            bytes[i] = msg.charCodeAt(i);
          }
        }
        return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
      }
      function md5ToHexEncodedArray(input) {
        const output = [];
        const length32 = input.length * 32;
        const hexTab = "0123456789abcdef";
        for (let i = 0; i < length32; i += 8) {
          const x = input[i >> 5] >>> i % 32 & 255;
          const hex = parseInt(hexTab.charAt(x >>> 4 & 15) + hexTab.charAt(x & 15), 16);
          output.push(hex);
        }
        return output;
      }
      function getOutputLength(inputLength8) {
        return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
      }
      function wordsToMd5(x, len) {
        x[len >> 5] |= 128 << len % 32;
        x[getOutputLength(len) - 1] = len;
        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;
        for (let i = 0; i < x.length; i += 16) {
          const olda = a;
          const oldb = b;
          const oldc = c;
          const oldd = d;
          a = md5ff(a, b, c, d, x[i], 7, -680876936);
          d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
          c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
          b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
          a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
          d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
          c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
          b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
          a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
          d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
          c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
          b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
          a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
          d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
          c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
          b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
          a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
          d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
          c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
          b = md5gg(b, c, d, a, x[i], 20, -373897302);
          a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
          d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
          c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
          b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
          a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
          d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
          c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
          b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
          a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
          d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
          c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
          b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
          a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
          d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
          c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
          b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
          a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
          d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
          c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
          b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
          a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
          d = md5hh(d, a, b, c, x[i], 11, -358537222);
          c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
          b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
          a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
          d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
          c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
          b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
          a = md5ii(a, b, c, d, x[i], 6, -198630844);
          d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
          c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
          b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
          a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
          d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
          c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
          b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
          a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
          d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
          c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
          b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
          a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
          d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
          c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
          b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
          a = safeAdd(a, olda);
          b = safeAdd(b, oldb);
          c = safeAdd(c, oldc);
          d = safeAdd(d, oldd);
        }
        return [a, b, c, d];
      }
      function bytesToWords(input) {
        if (input.length === 0) {
          return [];
        }
        const length8 = input.length * 8;
        const output = new Uint32Array(getOutputLength(length8));
        for (let i = 0; i < length8; i += 8) {
          output[i >> 5] |= (input[i / 8] & 255) << i % 32;
        }
        return output;
      }
      function safeAdd(x, y) {
        const lsw = (x & 65535) + (y & 65535);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return msw << 16 | lsw & 65535;
      }
      function bitRotateLeft(num, cnt) {
        return num << cnt | num >>> 32 - cnt;
      }
      function md5cmn(q, a, b, x, s, t) {
        return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
      }
      function md5ff(a, b, c, d, x, s, t) {
        return md5cmn(b & c | ~b & d, a, b, x, s, t);
      }
      function md5gg(a, b, c, d, x, s, t) {
        return md5cmn(b & d | c & ~d, a, b, x, s, t);
      }
      function md5hh(a, b, c, d, x, s, t) {
        return md5cmn(b ^ c ^ d, a, b, x, s, t);
      }
      function md5ii(a, b, c, d, x, s, t) {
        return md5cmn(c ^ (b | ~d), a, b, x, s, t);
      }
      var _default = md5;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/v3.js
  var require_v3 = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/v3.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _v = _interopRequireDefault(require_v35());
      var _md = _interopRequireDefault(require_md5());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var v3 = (0, _v.default)("v3", 48, _md.default);
      var _default = v3;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/native.js
  var require_native = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/native.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
      var _default = {
        randomUUID
      };
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/v4.js
  var require_v4 = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/v4.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _native = _interopRequireDefault(require_native());
      var _rng = _interopRequireDefault(require_rng());
      var _stringify = require_stringify();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function v4(options, buf, offset) {
        if (_native.default.randomUUID && !buf && !options) {
          return _native.default.randomUUID();
        }
        options = options || {};
        const rnds = options.random || (options.rng || _rng.default)();
        rnds[6] = rnds[6] & 15 | 64;
        rnds[8] = rnds[8] & 63 | 128;
        if (buf) {
          offset = offset || 0;
          for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
          }
          return buf;
        }
        return (0, _stringify.unsafeStringify)(rnds);
      }
      var _default = v4;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/sha1.js
  var require_sha1 = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/sha1.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      function f(s, x, y, z) {
        switch (s) {
          case 0:
            return x & y ^ ~x & z;
          case 1:
            return x ^ y ^ z;
          case 2:
            return x & y ^ x & z ^ y & z;
          case 3:
            return x ^ y ^ z;
        }
      }
      function ROTL(x, n) {
        return x << n | x >>> 32 - n;
      }
      function sha1(bytes) {
        const K = [1518500249, 1859775393, 2400959708, 3395469782];
        const H = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
        if (typeof bytes === "string") {
          const msg = unescape(encodeURIComponent(bytes));
          bytes = [];
          for (let i = 0; i < msg.length; ++i) {
            bytes.push(msg.charCodeAt(i));
          }
        } else if (!Array.isArray(bytes)) {
          bytes = Array.prototype.slice.call(bytes);
        }
        bytes.push(128);
        const l = bytes.length / 4 + 2;
        const N = Math.ceil(l / 16);
        const M = new Array(N);
        for (let i = 0; i < N; ++i) {
          const arr = new Uint32Array(16);
          for (let j = 0; j < 16; ++j) {
            arr[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
          }
          M[i] = arr;
        }
        M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
        M[N - 1][14] = Math.floor(M[N - 1][14]);
        M[N - 1][15] = (bytes.length - 1) * 8 & 4294967295;
        for (let i = 0; i < N; ++i) {
          const W = new Uint32Array(80);
          for (let t = 0; t < 16; ++t) {
            W[t] = M[i][t];
          }
          for (let t = 16; t < 80; ++t) {
            W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
          }
          let a = H[0];
          let b = H[1];
          let c = H[2];
          let d = H[3];
          let e = H[4];
          for (let t = 0; t < 80; ++t) {
            const s = Math.floor(t / 20);
            const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
            e = d;
            d = c;
            c = ROTL(b, 30) >>> 0;
            b = a;
            a = T;
          }
          H[0] = H[0] + a >>> 0;
          H[1] = H[1] + b >>> 0;
          H[2] = H[2] + c >>> 0;
          H[3] = H[3] + d >>> 0;
          H[4] = H[4] + e >>> 0;
        }
        return [H[0] >> 24 & 255, H[0] >> 16 & 255, H[0] >> 8 & 255, H[0] & 255, H[1] >> 24 & 255, H[1] >> 16 & 255, H[1] >> 8 & 255, H[1] & 255, H[2] >> 24 & 255, H[2] >> 16 & 255, H[2] >> 8 & 255, H[2] & 255, H[3] >> 24 & 255, H[3] >> 16 & 255, H[3] >> 8 & 255, H[3] & 255, H[4] >> 24 & 255, H[4] >> 16 & 255, H[4] >> 8 & 255, H[4] & 255];
      }
      var _default = sha1;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/v5.js
  var require_v5 = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/v5.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _v = _interopRequireDefault(require_v35());
      var _sha = _interopRequireDefault(require_sha1());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var v5 = (0, _v.default)("v5", 80, _sha.default);
      var _default = v5;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/nil.js
  var require_nil = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/nil.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _default = "00000000-0000-0000-0000-000000000000";
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/version.js
  var require_version = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/version.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _validate = _interopRequireDefault(require_validate());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function version(uuid) {
        if (!(0, _validate.default)(uuid)) {
          throw TypeError("Invalid UUID");
        }
        return parseInt(uuid.slice(14, 15), 16);
      }
      var _default = version;
      exports.default = _default;
    }
  });

  // node_modules/uuid/dist/commonjs-browser/index.js
  var require_commonjs_browser = __commonJS({
    "node_modules/uuid/dist/commonjs-browser/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      Object.defineProperty(exports, "NIL", {
        enumerable: true,
        get: function get() {
          return _nil.default;
        }
      });
      Object.defineProperty(exports, "parse", {
        enumerable: true,
        get: function get() {
          return _parse.default;
        }
      });
      Object.defineProperty(exports, "stringify", {
        enumerable: true,
        get: function get() {
          return _stringify.default;
        }
      });
      Object.defineProperty(exports, "v1", {
        enumerable: true,
        get: function get() {
          return _v.default;
        }
      });
      Object.defineProperty(exports, "v3", {
        enumerable: true,
        get: function get() {
          return _v2.default;
        }
      });
      Object.defineProperty(exports, "v4", {
        enumerable: true,
        get: function get() {
          return _v3.default;
        }
      });
      Object.defineProperty(exports, "v5", {
        enumerable: true,
        get: function get() {
          return _v4.default;
        }
      });
      Object.defineProperty(exports, "validate", {
        enumerable: true,
        get: function get() {
          return _validate.default;
        }
      });
      Object.defineProperty(exports, "version", {
        enumerable: true,
        get: function get() {
          return _version.default;
        }
      });
      var _v = _interopRequireDefault(require_v1());
      var _v2 = _interopRequireDefault(require_v3());
      var _v3 = _interopRequireDefault(require_v4());
      var _v4 = _interopRequireDefault(require_v5());
      var _nil = _interopRequireDefault(require_nil());
      var _version = _interopRequireDefault(require_version());
      var _validate = _interopRequireDefault(require_validate());
      var _stringify = _interopRequireDefault(require_stringify());
      var _parse = _interopRequireDefault(require_parse2());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
    }
  });

  // node_modules/@circle-fin/w3s-pw-web-sdk/dist/package.json
  var require_package = __commonJS({
    "node_modules/@circle-fin/w3s-pw-web-sdk/dist/package.json"(exports, module) {
      module.exports = {
        name: "@circle-fin/w3s-pw-web-sdk",
        version: "1.1.11",
        description: "Javascript/Typescript SDK for Circle Programmable Wallets",
        main: "dist/src/index.js",
        types: "dist/src/index.d.ts",
        scripts: {
          build: "npx tsc",
          test: "jest --env=jsdom",
          "test:watch": "jest --watch --env=jsdom",
          lint: "eslint . --ext .ts",
          "lint-fix": "eslint . --ext .ts --fix",
          format: "prettier --write .",
          "format-check": "prettier --check src/"
        },
        repository: {
          type: "git",
          url: "git+https://github.com/circlefin/w3s-pw-web-sdk.git"
        },
        keywords: [
          "circle",
          "circle.com",
          "usdc",
          "euroc",
          "stablecoins",
          "programmable wallets"
        ],
        homepage: "https://github.com/circlefin/w3s-pw-web-sdk#readme",
        publishConfig: {
          registry: "https://registry.npmjs.com/"
        },
        license: "Apache-2.0",
        bugs: {
          url: "https://github.com/circlefin/w3s-pw-web-sdk/issues"
        },
        engines: {
          node: ">=10.0.0"
        },
        dependencies: {
          dotenv: "^16.3.1",
          firebase: "^10.12.1",
          jsonwebtoken: "^9.0.2",
          uuid: "^9.0.1"
        },
        devDependencies: {
          "@types/jest": "^28.1.7",
          "@types/node": "^14.14.14",
          "@typescript-eslint/eslint-plugin": "^5.0.0",
          eslint: "^8.0.1",
          "eslint-config-standard-with-typescript": "^22.0.0",
          "eslint-plugin-import": "^2.25.2",
          "eslint-plugin-n": "^16.3.0",
          "eslint-plugin-promise": "^6.1.1",
          jest: "^29.6.1",
          "jest-environment-jsdom": "^29.6.1",
          prettier: "^2.7.1",
          "ts-jest": "^29.1.1",
          typescript: "^4.9.5"
        }
      };
    }
  });

  // node_modules/@circle-fin/w3s-pw-web-sdk/dist/src/types.js
  var require_types = __commonJS({
    "node_modules/@circle-fin/w3s-pw-web-sdk/dist/src/types.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SocialLoginProvider = exports.ErrorCode = exports.QuestionType = exports.ChallengeStatus = exports.ChallengeType = void 0;
      var ChallengeType;
      (function(ChallengeType2) {
        ChallengeType2["INITIALIZE"] = "INITIALIZE";
        ChallengeType2["SET_PIN"] = "SET_PIN";
        ChallengeType2["CHANGE_PIN"] = "CHANGE_PIN";
        ChallengeType2["RESTORE_PIN"] = "RESTORE_PIN";
        ChallengeType2["SET_SECURITY_QUESTIONS"] = "SET_SECURITY_QUESTIONS";
        ChallengeType2["CREATE_WALLET"] = "CREATE_WALLET";
        ChallengeType2["CREATE_TRANSACTION"] = "CREATE_TRANSACTION";
        ChallengeType2["ACCELERATE_TRANSACTION"] = "ACCELERATE_TRANSACTION";
        ChallengeType2["CANCEL_TRANSACTION"] = "CANCEL_TRANSACTION";
        ChallengeType2["SIGN_MESSAGE"] = "SIGN_MESSAGE";
        ChallengeType2["SIGN_TYPEDDATA"] = "SIGN_TYPEDDATA";
        ChallengeType2["SIGN_TRANSACTION"] = "SIGN_TRANSACTION";
        ChallengeType2["UNKNOWN"] = "UNKNOWN";
      })(ChallengeType = exports.ChallengeType || (exports.ChallengeType = {}));
      var ChallengeStatus;
      (function(ChallengeStatus2) {
        ChallengeStatus2["COMPLETE"] = "COMPLETE";
        ChallengeStatus2["EXPIRED"] = "EXPIRED";
        ChallengeStatus2["FAILED"] = "FAILED";
        ChallengeStatus2["IN_PROGRESS"] = "IN_PROGRESS";
        ChallengeStatus2["PENDING"] = "PENDING";
      })(ChallengeStatus = exports.ChallengeStatus || (exports.ChallengeStatus = {}));
      var QuestionType;
      (function(QuestionType2) {
        QuestionType2["DATE"] = "DATE";
        QuestionType2["TEXT"] = "TEXT";
      })(QuestionType = exports.QuestionType || (exports.QuestionType = {}));
      var ErrorCode;
      (function(ErrorCode2) {
        ErrorCode2[ErrorCode2["unknown"] = -1] = "unknown";
        ErrorCode2[ErrorCode2["success"] = 0] = "success";
        ErrorCode2[ErrorCode2["apiParameterMissing"] = 1] = "apiParameterMissing";
        ErrorCode2[ErrorCode2["apiParameterInvalid"] = 2] = "apiParameterInvalid";
        ErrorCode2[ErrorCode2["forbidden"] = 3] = "forbidden";
        ErrorCode2[ErrorCode2["unauthorized"] = 4] = "unauthorized";
        ErrorCode2[ErrorCode2["retry"] = 9] = "retry";
        ErrorCode2[ErrorCode2["customerSuspended"] = 10] = "customerSuspended";
        ErrorCode2[ErrorCode2["pending"] = 11] = "pending";
        ErrorCode2[ErrorCode2["invalidSession"] = 12] = "invalidSession";
        ErrorCode2[ErrorCode2["invalidPartnerId"] = 13] = "invalidPartnerId";
        ErrorCode2[ErrorCode2["invalidMessage"] = 14] = "invalidMessage";
        ErrorCode2[ErrorCode2["invalidPhone"] = 15] = "invalidPhone";
        ErrorCode2[ErrorCode2["userAlreadyExisted"] = 155101] = "userAlreadyExisted";
        ErrorCode2[ErrorCode2["userNotFound"] = 155102] = "userNotFound";
        ErrorCode2[ErrorCode2["userTokenNotFound"] = 155103] = "userTokenNotFound";
        ErrorCode2[ErrorCode2["userTokenExpired"] = 155104] = "userTokenExpired";
        ErrorCode2[ErrorCode2["invalidUserToken"] = 155105] = "invalidUserToken";
        ErrorCode2[ErrorCode2["userWasInitialized"] = 155106] = "userWasInitialized";
        ErrorCode2[ErrorCode2["userHasSetPin"] = 155107] = "userHasSetPin";
        ErrorCode2[ErrorCode2["userHasSetSecurityQuestion"] = 155108] = "userHasSetSecurityQuestion";
        ErrorCode2[ErrorCode2["userWasDisabled"] = 155109] = "userWasDisabled";
        ErrorCode2[ErrorCode2["userDoesNotSetPinYet"] = 155110] = "userDoesNotSetPinYet";
        ErrorCode2[ErrorCode2["userDoesNotSetSecurityQuestionYet"] = 155111] = "userDoesNotSetSecurityQuestionYet";
        ErrorCode2[ErrorCode2["incorrectUserPin"] = 155112] = "incorrectUserPin";
        ErrorCode2[ErrorCode2["incorrectDeviceId"] = 155113] = "incorrectDeviceId";
        ErrorCode2[ErrorCode2["incorrectAppId"] = 155114] = "incorrectAppId";
        ErrorCode2[ErrorCode2["incorrectSecurityAnswers"] = 155115] = "incorrectSecurityAnswers";
        ErrorCode2[ErrorCode2["invalidChallengeId"] = 155116] = "invalidChallengeId";
        ErrorCode2[ErrorCode2["invalidApproveContent"] = 155117] = "invalidApproveContent";
        ErrorCode2[ErrorCode2["invalidEncryptionKey"] = 155118] = "invalidEncryptionKey";
        ErrorCode2[ErrorCode2["userPinLocked"] = 155119] = "userPinLocked";
        ErrorCode2[ErrorCode2["securityAnswersLocked"] = 155120] = "securityAnswersLocked";
        ErrorCode2[ErrorCode2["userOTPTokenExpiredError"] = 155130] = "userOTPTokenExpiredError";
        ErrorCode2[ErrorCode2["userOTPTokenInvalidError"] = 155131] = "userOTPTokenInvalidError";
        ErrorCode2[ErrorCode2["userOTPNotFoundError"] = 155132] = "userOTPNotFoundError";
        ErrorCode2[ErrorCode2["userOTPInvalidError"] = 155133] = "userOTPInvalidError";
        ErrorCode2[ErrorCode2["userOTPNotMatchError"] = 155134] = "userOTPNotMatchError";
        ErrorCode2[ErrorCode2["userEmailInvalidError"] = 155135] = "userEmailInvalidError";
        ErrorCode2[ErrorCode2["userEmailMismatchError"] = 155136] = "userEmailMismatchError";
        ErrorCode2[ErrorCode2["deviceIDInvalidError"] = 155137] = "deviceIDInvalidError";
        ErrorCode2[ErrorCode2["emailSendingFailedError"] = 155138] = "emailSendingFailedError";
        ErrorCode2[ErrorCode2["socialLoginTokenExpiredError"] = 155139] = "socialLoginTokenExpiredError";
        ErrorCode2[ErrorCode2["socialLoginProviderAppIDNotMatchError"] = 155140] = "socialLoginProviderAppIDNotMatchError";
        ErrorCode2[ErrorCode2["userOTPIsLockedError"] = 155141] = "userOTPIsLockedError";
        ErrorCode2[ErrorCode2["userOTPSendCountsOverLimitError"] = 155142] = "userOTPSendCountsOverLimitError";
        ErrorCode2[ErrorCode2["deviceTokenExpiredError"] = 155143] = "deviceTokenExpiredError";
        ErrorCode2[ErrorCode2["deviceTokenInvalidError"] = 155144] = "deviceTokenInvalidError";
        ErrorCode2[ErrorCode2["deviceTokenNotFoundError"] = 155145] = "deviceTokenNotFoundError";
        ErrorCode2[ErrorCode2["notEnoughFunds"] = 155201] = "notEnoughFunds";
        ErrorCode2[ErrorCode2["notEnoughBalance"] = 155202] = "notEnoughBalance";
        ErrorCode2[ErrorCode2["exceedWithdrawLimit"] = 155203] = "exceedWithdrawLimit";
        ErrorCode2[ErrorCode2["minimumFundsRequired"] = 155204] = "minimumFundsRequired";
        ErrorCode2[ErrorCode2["invalidTransactionFee"] = 155205] = "invalidTransactionFee";
        ErrorCode2[ErrorCode2["rejectedOnAmlScreening"] = 155206] = "rejectedOnAmlScreening";
        ErrorCode2[ErrorCode2["tagRequired"] = 155207] = "tagRequired";
        ErrorCode2[ErrorCode2["gasLimitTooLow"] = 155208] = "gasLimitTooLow";
        ErrorCode2[ErrorCode2["transactionDataNotEncodedProperly"] = 155209] = "transactionDataNotEncodedProperly";
        ErrorCode2[ErrorCode2["fullNodeReturnedError"] = 155210] = "fullNodeReturnedError";
        ErrorCode2[ErrorCode2["walletSetupRequired"] = 155211] = "walletSetupRequired";
        ErrorCode2[ErrorCode2["lowerThenMinimumAccountBalance"] = 155212] = "lowerThenMinimumAccountBalance";
        ErrorCode2[ErrorCode2["rejectedByBlockchain"] = 155213] = "rejectedByBlockchain";
        ErrorCode2[ErrorCode2["droppedAsPartOfReorg"] = 155214] = "droppedAsPartOfReorg";
        ErrorCode2[ErrorCode2["operationNotSupport"] = 155215] = "operationNotSupport";
        ErrorCode2[ErrorCode2["amountBelowMinimum"] = 155216] = "amountBelowMinimum";
        ErrorCode2[ErrorCode2["wrongNftTokenIdNumber"] = 155217] = "wrongNftTokenIdNumber";
        ErrorCode2[ErrorCode2["invalidDestinationAddress"] = 155218] = "invalidDestinationAddress";
        ErrorCode2[ErrorCode2["tokenWalletChainMismatch"] = 155219] = "tokenWalletChainMismatch";
        ErrorCode2[ErrorCode2["wrongAmountsNumber"] = 155220] = "wrongAmountsNumber";
        ErrorCode2[ErrorCode2["walletIsFrozen"] = 155501] = "walletIsFrozen";
        ErrorCode2[ErrorCode2["maxWalletLimitReached"] = 155502] = "maxWalletLimitReached";
        ErrorCode2[ErrorCode2["walletSetIdMutuallyExclusive"] = 155503] = "walletSetIdMutuallyExclusive";
        ErrorCode2[ErrorCode2["metadataUnmatched"] = 155504] = "metadataUnmatched";
        ErrorCode2[ErrorCode2["userCanceled"] = 155701] = "userCanceled";
        ErrorCode2[ErrorCode2["launchUiFailed"] = 155702] = "launchUiFailed";
        ErrorCode2[ErrorCode2["pinCodeNotMatched"] = 155703] = "pinCodeNotMatched";
        ErrorCode2[ErrorCode2["insecurePinCode"] = 155704] = "insecurePinCode";
        ErrorCode2[ErrorCode2["hintsMatchAnswers"] = 155705] = "hintsMatchAnswers";
        ErrorCode2[ErrorCode2["networkError"] = 155706] = "networkError";
        ErrorCode2[ErrorCode2["userSecretMissing"] = 155717] = "userSecretMissing";
        ErrorCode2[ErrorCode2["invalidUserTokenFormat"] = 155718] = "invalidUserTokenFormat";
        ErrorCode2[ErrorCode2["userTokenMismatch"] = 155719] = "userTokenMismatch";
        ErrorCode2[ErrorCode2["walletIdNotFound"] = 156001] = "walletIdNotFound";
        ErrorCode2[ErrorCode2["tokenIdNotFound"] = 156002] = "tokenIdNotFound";
        ErrorCode2[ErrorCode2["transactionIdNotFound"] = 156003] = "transactionIdNotFound";
        ErrorCode2[ErrorCode2["entityCredentialNotFound"] = 156004] = "entityCredentialNotFound";
        ErrorCode2[ErrorCode2["walletSetIdNotFound"] = 156005] = "walletSetIdNotFound";
      })(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
      var SocialLoginProvider;
      (function(SocialLoginProvider2) {
        SocialLoginProvider2["APPLE"] = "Apple";
        SocialLoginProvider2["FACEBOOK"] = "Facebook";
        SocialLoginProvider2["GOOGLE"] = "Google";
      })(SocialLoginProvider = exports.SocialLoginProvider || (exports.SocialLoginProvider = {}));
    }
  });

  // node_modules/@circle-fin/w3s-pw-web-sdk/dist/src/index.js
  var require_index = __commonJS({
    "node_modules/@circle-fin/w3s-pw-web-sdk/dist/src/index.js"(exports) {
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.W3SSdk = void 0;
      var app_1 = __require("firebase/app");
      var auth_1 = __require("firebase/auth");
      var jsonwebtoken_1 = require_jsonwebtoken();
      var uuid_1 = require_commonjs_browser();
      var package_json_1 = __importDefault(require_package());
      var types_1 = require_types();
      var W3SSdk = class _W3SSdk {
        constructor(configs, onLoginComplete) {
          this.serviceUrl = "https://pw-auth.circle.com";
          this.window = window;
          this.securityQuestionsRequiredCount = 2;
          this.shouldCloseModalOnForgotPin = false;
          this.receivedResponseFromService = false;
          this.messageHandler = (event) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
            if (event.origin !== this.serviceUrl) {
              return;
            }
            if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.onFrameReady) {
              this.receivedResponseFromService = true;
              const iframe = this.window.document.getElementById("sdkIframe");
              (_b = iframe === null || iframe === void 0 ? void 0 : iframe.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage({
                w3s: {
                  appSettings: (_c = this.configs) === null || _c === void 0 ? void 0 : _c.appSettings,
                  auth: (_d = this.configs) === null || _d === void 0 ? void 0 : _d.authentication,
                  challenge: this.challenge,
                  customizations: {
                    securityQuestions: {
                      questions: this.securityQuestions,
                      requiredCount: this.securityQuestionsRequiredCount,
                      securityConfirmItems: this.securityConfirmItems
                    },
                    themeColor: this.themeColor,
                    localizations: this.localizations,
                    resources: this.resources,
                    customLinks: this.customLinks
                  },
                  deviceInfo: this.deviceInfo,
                  socialVerification: {
                    token: this.socialLoginToken,
                    deviceToken: (_f = (_e = this.configs) === null || _e === void 0 ? void 0 : _e.loginConfigs) === null || _f === void 0 ? void 0 : _f.deviceToken,
                    deviceEncryptionKey: (_h = (_g = this.configs) === null || _g === void 0 ? void 0 : _g.loginConfigs) === null || _h === void 0 ? void 0 : _h.deviceEncryptionKey,
                    socialLoginProvider: this.socialLoginProvider
                  },
                  emailVerification: {
                    deviceToken: (_k = (_j = this.configs) === null || _j === void 0 ? void 0 : _j.loginConfigs) === null || _k === void 0 ? void 0 : _k.deviceToken,
                    deviceEncryptionKey: (_m = (_l = this.configs) === null || _l === void 0 ? void 0 : _l.loginConfigs) === null || _m === void 0 ? void 0 : _m.deviceEncryptionKey,
                    otpToken: (_p = (_o = this.configs) === null || _o === void 0 ? void 0 : _o.loginConfigs) === null || _p === void 0 ? void 0 : _p.otpToken
                  }
                }
              }, this.serviceUrl);
            } else if ((_q = event.data) === null || _q === void 0 ? void 0 : _q.onForgotPin) {
              (_r = this.onForgotPin) === null || _r === void 0 ? void 0 : _r.call(this);
            } else if ((_s = event.data) === null || _s === void 0 ? void 0 : _s.onComplete) {
              const iframe = this.window.document.getElementById("sdkIframe");
              (_t = iframe === null || iframe === void 0 ? void 0 : iframe.parentNode) === null || _t === void 0 ? void 0 : _t.removeChild(iframe);
              void ((_u = this.onComplete) === null || _u === void 0 ? void 0 : _u.call(this, void 0, (_v = event.data) === null || _v === void 0 ? void 0 : _v.result));
            } else if ((_w = event.data) === null || _w === void 0 ? void 0 : _w.deviceId) {
              (_x = this.resolveDeviceIdPromise) === null || _x === void 0 ? void 0 : _x.call(this, event.data.deviceId);
              this.closeModal();
              this.unSubscribeMessage();
            } else if ((_y = event.data) === null || _y === void 0 ? void 0 : _y.showUi) {
              this.iframe.width = "100%";
              this.iframe.height = "100%";
              this.iframe.style.zIndex = "2147483647";
              this.iframe.style.position = "fixed";
              this.iframe.style.top = "50%";
              this.iframe.style.left = "50%";
              this.iframe.style.transform = "translate(-50%, -50%)";
              this.iframe.style.display = "";
            } else if ((_z = event.data) === null || _z === void 0 ? void 0 : _z.onSocialLoginVerified) {
              void ((_0 = this.onLoginComplete) === null || _0 === void 0 ? void 0 : _0.call(this, event.data.onSocialLoginVerified.error, event.data.onSocialLoginVerified.result));
              this.closeModal();
              this.unSubscribeMessage();
            } else if ((_1 = event.data) === null || _1 === void 0 ? void 0 : _1.onEmailLoginVerified) {
              void ((_2 = this.onLoginComplete) === null || _2 === void 0 ? void 0 : _2.call(this, event.data.onEmailLoginVerified.error, event.data.onEmailLoginVerified.result));
              if (event.data.onEmailLoginVerified.result && !event.data.onEmailLoginVerified.error) {
                this.unSubscribeMessage();
                this.closeModal();
              }
            } else if ((_3 = event.data) === null || _3 === void 0 ? void 0 : _3.onResendOtpEmail) {
              (_4 = this.onResendOtpEmail) === null || _4 === void 0 ? void 0 : _4.call(this);
            } else if ((_5 = event.data) === null || _5 === void 0 ? void 0 : _5.onError) {
              void ((_6 = this.onComplete) === null || _6 === void 0 ? void 0 : _6.call(this, (_7 = event.data) === null || _7 === void 0 ? void 0 : _7.error, void 0));
            } else if ((_8 = event.data) === null || _8 === void 0 ? void 0 : _8.onClose) {
              this.closeModal();
              this.unSubscribeMessage();
            }
          };
          if (_W3SSdk.instance != null) {
            this.setupInstance(configs, onLoginComplete);
            return _W3SSdk.instance;
          }
          this.iframe = document.createElement("iframe");
          this.setupInstance(configs, onLoginComplete);
          _W3SSdk.instance = this;
        }
        /**
         * Sets the application settings.
         * This method will be deprecated in the future. Please use the constructor to set the application settings.
         * @param appSettings - Application settings.
         */
        setAppSettings(appSettings) {
          if (this.configs) {
            this.configs.appSettings = appSettings;
          } else {
            this.configs = { appSettings };
          }
        }
        /**
         * Sets the authentication information.
         * @param auth - Authentication information.
         */
        setAuthentication(auth) {
          if (this.configs) {
            this.configs.authentication = auth;
          } else {
            this.configs = {
              appSettings: {
                appId: ""
              },
              authentication: auth
            };
          }
        }
        /**
         * Updates the configurations.
         * @param configs - Configurations.
         * @param onLoginComplete - Callback function that is called when the page is redirected back from the social login provider and receives the verification result.
         */
        updateConfigs(configs, onLoginComplete) {
          this.setupInstance(configs, onLoginComplete !== null && onLoginComplete !== void 0 ? onLoginComplete : this.onLoginComplete);
        }
        /**
         * Gets the device ID.
         * @returns Promise<string> - Device ID.
         */
        getDeviceId() {
          return new Promise((resolve, reject) => {
            this.resolveDeviceIdPromise = resolve;
            this.rejectDeviceIdPromise = reject;
            this.subscribeMessage();
            this.appendIframe(false, "device-id");
            setTimeout(() => {
              var _a;
              if (!this.receivedResponseFromService) {
                (_a = this.rejectDeviceIdPromise) === null || _a === void 0 ? void 0 : _a.call(this, "Failed to receive deviceId");
                this.closeModal();
                this.unSubscribeMessage();
              }
            }, 1e3 * 10);
          });
        }
        /**
         * Performs social login.
         * @param provider - Social login provider.
         */
        performLogin(provider) {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            if (provider === types_1.SocialLoginProvider.GOOGLE) {
              this.performGoogleLogin();
            } else if (provider === types_1.SocialLoginProvider.FACEBOOK) {
              this.performFacebookLogin();
            } else if (provider === types_1.SocialLoginProvider.APPLE) {
              yield this.performAppleLogin();
            } else {
              void ((_a = this.onLoginComplete) === null || _a === void 0 ? void 0 : _a.call(this, {
                code: 155140,
                message: "Invalid social login provider"
              }, void 0));
            }
          });
        }
        /**
         * Executes email OTP verification.
         */
        verifyOtp() {
          this.subscribeMessage();
          this.appendIframe(true, "social/verify-email");
          setTimeout(() => {
            var _a;
            if (!this.receivedResponseFromService) {
              void ((_a = this.onComplete) === null || _a === void 0 ? void 0 : _a.call(this, {
                code: 155706,
                message: "Network error"
              }, void 0));
            }
          }, 1e3 * 10);
        }
        /**
         * Executes the challenge.
         * @param challengeId - Challenge ID.
         * @param onCompleted - Callback function that is called when the challenge is completed.
         */
        execute(challengeId, onCompleted) {
          this.subscribeMessage();
          this.setChallenge({ challengeId });
          this.exec(onCompleted, false);
        }
        /**
         * Sets the custom security questions. If the user doesn't provide the custom security questions, the default security questions will be used.
         * @param questions - Custom security questions.
         * @param requiredCount - Required number of security questions.
         * @param securityConfirmItems - Security confirm disclaimer items.
         */
        setCustomSecurityQuestions(questions, requiredCount = 2, securityConfirmItems) {
          this.securityQuestions = questions;
          this.securityConfirmItems = securityConfirmItems;
          if (requiredCount <= 0) {
            this.securityQuestionsRequiredCount = 2;
          } else {
            this.securityQuestionsRequiredCount = requiredCount;
          }
        }
        /**
         * Sets the localizations.
         * @param localizations - Localizations.
         */
        setLocalizations(localizations) {
          this.localizations = localizations;
        }
        /**
         * Sets the resources.
         * @param resources - Resources.
         */
        setResources(resources) {
          this.resources = resources;
        }
        /**
         * Sets the theme color.
         * @param themeColor - Theme color.
         */
        setThemeColor(themeColor) {
          this.themeColor = themeColor;
        }
        /**
         * Sets the custom links.
         * @param customLinks - Custom links.
         */
        setCustomLinks(customLinks) {
          this.customLinks = customLinks;
        }
        /**
         * Sets the callback function that is called when the user clicks the forgot pin button.
         * @param onForgotPin - Callback function that is called when the user clicks the forgot pin button.
         * @param shouldCloseModalOnForgotPin - Indicates whether the modal should be closed when the user clicks the forgot pin button.  Default is false.
         */
        setOnForgotPin(onForgotPin, shouldCloseModalOnForgotPin = false) {
          this.shouldCloseModalOnForgotPin = shouldCloseModalOnForgotPin;
          this.onForgotPin = () => {
            if (this.shouldCloseModalOnForgotPin) {
              this.closeModal();
            }
            onForgotPin === null || onForgotPin === void 0 ? void 0 : onForgotPin();
          };
        }
        /**
         * Sets the callback function that is called when the user clicks the resend OTP email button.
         * @param onResendOtpEmail - Callback function that is called when the user clicks the resend OTP email button.
         */
        setOnResendOtpEmail(onResendOtpEmail) {
          this.onResendOtpEmail = onResendOtpEmail;
        }
        /**
         * Sets up the instance.
         * @param configs - Configurations.
         * @param onLoginComplete - Callback function that is called when the page is redirected back from the social login provider and receives the verification result.
         */
        setupInstance(configs, onLoginComplete) {
          var _a;
          if (((_a = configs === null || configs === void 0 ? void 0 : configs.loginConfigs) === null || _a === void 0 ? void 0 : _a.apple) && (0, app_1.getApps)().length === 0) {
            this.firebaseApp = (0, app_1.initializeApp)(configs.loginConfigs.apple);
          } else if ((0, app_1.getApps)().length !== 0) {
            this.firebaseApp = (0, app_1.getApps)()[0];
          }
          this.onLoginComplete = onLoginComplete;
          this.configs = configs;
          this.deviceInfo = {
            model: "Web",
            version: package_json_1.default.version
          };
          void this.execSocialLoginStatusCheck();
        }
        /**
         * Sets the challenge.
         * @param challenge - Challenge.
         */
        setChallenge(challenge) {
          this.challenge = challenge;
        }
        /**
         * Appends the iframe to the document body.
         * @param showIframe - Indicates whether the iframe should be shown. Default is true.
         * @param subRoute - Sub route.
         */
        appendIframe(showIframe = true, subRoute = "") {
          const protocol = this.window.location.protocol;
          const host = this.window.location.host;
          const fullDomainWithProtocol = `${protocol}//${host}`;
          this.iframe.src = `${this.serviceUrl}/${subRoute}?origin=${fullDomainWithProtocol}`;
          this.iframe.id = "sdkIframe";
          this.iframe.width = showIframe ? "100%" : "0%";
          this.iframe.height = showIframe ? "100%" : "0%";
          this.iframe.style.zIndex = showIframe ? "2147483647" : "-1";
          this.iframe.style.display = "none";
          if (showIframe) {
            this.iframe.style.position = "fixed";
            this.iframe.style.top = "50%";
            this.iframe.style.left = "50%";
            this.iframe.style.transform = "translate(-50%, -50%)";
            this.iframe.style.display = "";
          }
          document.body.appendChild(this.iframe);
        }
        /**
         * Executes the challenge.
         * @param onCompleted - Callback function that is called when the challenge is completed.
         * @param showIframe - Indicates whether the iframe should be shown. Default is true.
         */
        exec(onCompleted, showIframe = true) {
          this.appendIframe(showIframe);
          this.onComplete = onCompleted;
          setTimeout(() => {
            var _a;
            if (!this.receivedResponseFromService) {
              void ((_a = this.onComplete) === null || _a === void 0 ? void 0 : _a.call(this, {
                code: 155706,
                message: "Network error"
              }, void 0));
            }
          }, 1e3 * 10);
        }
        performAppleLogin() {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            if (!this.firebaseApp) {
              void ((_a = this.onLoginComplete) === null || _a === void 0 ? void 0 : _a.call(this, {
                code: 155140,
                message: "Please provide the Apple social login configurations."
              }, void 0));
              return;
            }
            this.saveOAuthInfo(types_1.SocialLoginProvider.APPLE);
            const provider = new auth_1.OAuthProvider("apple.com");
            const auth = (0, auth_1.getAuth)(this.firebaseApp);
            try {
              const cred = yield (0, auth_1.signInWithPopup)(auth, provider);
              if (!this.extractTokenFromResultAndSave(cred)) {
                return;
              }
              this.verifyTokenViaService();
              this.window.localStorage.setItem("socialLoginProvider", "");
            } catch (error) {
              if (error instanceof app_1.FirebaseError && error.code !== "auth/cancelled-popup-request" && error.code !== "auth/popup-closed-by-user") {
                yield this.handleFirebaseFailure(error);
              } else if (!(error instanceof app_1.FirebaseError)) {
                this.handleLoginFailure();
              }
            }
          });
        }
        performFacebookLogin() {
          var _a, _b, _c;
          if (!((_b = (_a = this === null || this === void 0 ? void 0 : this.configs) === null || _a === void 0 ? void 0 : _a.loginConfigs) === null || _b === void 0 ? void 0 : _b.facebook)) {
            void ((_c = this.onLoginComplete) === null || _c === void 0 ? void 0 : _c.call(this, {
              code: 155140,
              message: "Please provide the Facebook social login configurations."
            }, void 0));
            return;
          }
          const { appId, redirectUri } = this.configs.loginConfigs.facebook;
          const { url = "", state = "" } = this.generateOauthUrlWithParams(types_1.SocialLoginProvider.FACEBOOK, appId, redirectUri) || {};
          this.saveOAuthInfo(types_1.SocialLoginProvider.FACEBOOK, state);
          this.window.location.href = url;
        }
        performGoogleLogin() {
          var _a, _b, _c;
          if (!((_b = (_a = this.configs) === null || _a === void 0 ? void 0 : _a.loginConfigs) === null || _b === void 0 ? void 0 : _b.google)) {
            void ((_c = this.onLoginComplete) === null || _c === void 0 ? void 0 : _c.call(this, {
              code: 155140,
              message: "Please provide the Google social login configurations."
            }, void 0));
            return;
          }
          const { clientId, redirectUri, selectAccountPrompt } = this.configs.loginConfigs.google;
          const { url = "", state = "", nonce = "" } = this.generateOauthUrlWithParams(types_1.SocialLoginProvider.GOOGLE, clientId, redirectUri, selectAccountPrompt) || {};
          this.saveOAuthInfo(types_1.SocialLoginProvider.GOOGLE, state, nonce);
          this.window.location.href = url;
        }
        /**
         * Generates the OAuth URL with the necessary parameters.
         * @param provider - Social login provider.
         * @param id - Client ID or Application ID.
         * @param redirectUri - Redirect URI.
         * @param selectAccountPrompt - Indicates whether the user should select the account. Default is false.
         * @returns OAuth URL with the necessary parameters.
         */
        generateOauthUrlWithParams(provider, id, redirectUri, selectAccountPrompt = false) {
          const state = (0, uuid_1.v4)();
          if (provider === types_1.SocialLoginProvider.GOOGLE) {
            const scope = encodeURIComponent("openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
            const responseType = encodeURIComponent("id_token token");
            const nonce = (0, uuid_1.v4)();
            return {
              url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=${responseType}&nonce=${nonce}&prompt=${selectAccountPrompt ? "select_account" : "none"}`,
              state,
              nonce
            };
          } else if (provider === types_1.SocialLoginProvider.FACEBOOK) {
            const scope = encodeURIComponent("email");
            return {
              url: `https://www.facebook.com/v13.0/dialog/oauth?client_id=${id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=token`,
              state
            };
          }
        }
        /**
         * Executes the social login status check before sending the token to the verification service.
         */
        execSocialLoginStatusCheck() {
          return __awaiter(this, void 0, void 0, function* () {
            const socialLoginProvider = this.window.localStorage.getItem("socialLoginProvider");
            if (socialLoginProvider === types_1.SocialLoginProvider.APPLE) {
              yield this.handleAppleLoginResponse();
            } else if (this.isValidHash(this.window.location.hash)) {
              this.handleHashLoginResponse(socialLoginProvider);
            }
          });
        }
        /**
         * Handles the Apple login response.
         * @returns Promise<void>.
         */
        handleAppleLoginResponse() {
          return __awaiter(this, void 0, void 0, function* () {
            const auth = (0, auth_1.getAuth)(this.firebaseApp);
            try {
              const result = yield (0, auth_1.getRedirectResult)(auth);
              if (!result || !this.extractTokenFromResultAndSave(result)) {
                return;
              }
              this.verifyTokenViaService();
              this.window.localStorage.setItem("socialLoginProvider", "");
            } catch (error) {
              this.handleLoginFailure();
            }
          });
        }
        /**
         * Handles the hash login responses.
         * @param socialLoginProvider - Social login provider.
         */
        handleHashLoginResponse(socialLoginProvider) {
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          if (socialLoginProvider === types_1.SocialLoginProvider.GOOGLE) {
            this.handleGoogleLogin(hashParams);
          } else if (socialLoginProvider === types_1.SocialLoginProvider.FACEBOOK) {
            this.handleFacebookLogin(hashParams);
          }
          this.verifyTokenViaService();
          history.replaceState(null, "", window.location.href.split("#")[0]);
        }
        handleGoogleLogin(hashParams) {
          if (this.isLoginStateValid(hashParams) && this.isLoginNonceValid(hashParams)) {
            this.socialLoginToken = hashParams.get("id_token");
            this.socialLoginProvider = types_1.SocialLoginProvider.GOOGLE;
          }
        }
        handleFacebookLogin(hashParams) {
          if (this.isLoginStateValid(hashParams)) {
            this.socialLoginToken = hashParams.get("access_token");
            this.socialLoginProvider = types_1.SocialLoginProvider.FACEBOOK;
          }
        }
        isLoginStateValid(hashParams) {
          return this.checkSocialLoginState(hashParams);
        }
        isLoginNonceValid(hashParams) {
          return this.checkSocialLoginNonce(hashParams);
        }
        isValidHash(hash) {
          const validHashPattern = /^#(?:[a-zA-Z0-9-_.%]+=[^&]*&)*[a-zA-Z0-9-_.%]+=[^&]*$/;
          return validHashPattern.test(hash);
        }
        extractTokenFromResultAndSave(result) {
          const credential = auth_1.OAuthProvider.credentialFromResult(result);
          if (credential && credential.idToken) {
            this.socialLoginToken = credential.idToken;
            this.socialLoginProvider = types_1.SocialLoginProvider.APPLE;
            return true;
          }
          return false;
        }
        handleFirebaseFailure(error) {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            yield (_a = this.onLoginComplete) === null || _a === void 0 ? void 0 : _a.call(this, {
              code: -1,
              message: error.message
            }, void 0);
          });
        }
        handleLoginFailure() {
          var _a;
          void ((_a = this.onLoginComplete) === null || _a === void 0 ? void 0 : _a.call(this, {
            code: 155140,
            message: "Failed to validate the idToken / accessToken"
          }, void 0));
        }
        verifyTokenViaService() {
          this.subscribeMessage();
          this.appendIframe(false, "social/verify-token");
          setTimeout(() => {
            var _a;
            if (!this.receivedResponseFromService) {
              void ((_a = this.onComplete) === null || _a === void 0 ? void 0 : _a.call(this, {
                code: 155706,
                message: "Network error"
              }, void 0));
            }
          }, 1e3 * 10);
        }
        /**
         * Saves the OAuth information to the local storage in order to check the state and nonce value later.
         * @param provider - Social login provider.
         * @param state - State value.
         * @param nonce - Nonce value.
         */
        saveOAuthInfo(provider, state, nonce) {
          this.window.localStorage.setItem("socialLoginProvider", provider);
          this.window.localStorage.setItem("state", state !== null && state !== void 0 ? state : "");
          this.window.localStorage.setItem("nonce", nonce !== null && nonce !== void 0 ? nonce : "");
        }
        /**
         * Checks the state value from the social login response.
         * @param hashParams - Hash parameters.
         * @returns Indicates whether the state value is valid.
         */
        checkSocialLoginState(hashParams) {
          var _a;
          const state = hashParams.get("state");
          const storedState = this.window.localStorage.getItem("state");
          if (!storedState || state !== storedState) {
            void ((_a = this.onLoginComplete) === null || _a === void 0 ? void 0 : _a.call(this, {
              code: 155140,
              message: "Failed to validate the idToken / accessToken"
            }, void 0));
            return false;
          }
          return true;
        }
        /**
         * Checks the nonce value from the social login response. Only id token is going to have nonce value.
         * @param hashParams - Hash parameters.
         * @returns Indicates whether the nonce value is valid.
         */
        checkSocialLoginNonce(hashParams) {
          var _a, _b, _c;
          const token = hashParams.get("id_token");
          const decodedToken = (0, jsonwebtoken_1.decode)(token || "");
          const errorPayload = {
            code: 155140,
            message: "Failed to validate the idToken/ accessToken"
          };
          if (decodedToken === null) {
            void ((_a = this.onLoginComplete) === null || _a === void 0 ? void 0 : _a.call(this, errorPayload, void 0));
            return false;
          }
          try {
            const storedNonce = this.window.localStorage.getItem("nonce");
            if (!storedNonce || (decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.nonce) !== storedNonce) {
              void ((_b = this.onLoginComplete) === null || _b === void 0 ? void 0 : _b.call(this, errorPayload, void 0));
              return false;
            }
          } catch (_d) {
            void ((_c = this.onLoginComplete) === null || _c === void 0 ? void 0 : _c.call(this, errorPayload, void 0));
            return false;
          }
          return true;
        }
        /**
         * Closes the modal.
         */
        closeModal() {
          var _a;
          const iframe = this.window.document.getElementById("sdkIframe");
          (_a = iframe === null || iframe === void 0 ? void 0 : iframe.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(iframe);
        }
        /**
         * Subscribes to the postMessage event.
         */
        subscribeMessage() {
          this.window.addEventListener("message", this.messageHandler, false);
        }
        /**
         * Unsubscribes to the postMessage event.
         */
        unSubscribeMessage() {
          this.window.removeEventListener("message", this.messageHandler, false);
        }
      };
      exports.W3SSdk = W3SSdk;
      W3SSdk.instance = null;
    }
  });
  return require_index();
})();
/*! Bundled license information:

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
