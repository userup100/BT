// app.js
(async () => {
  const { ethers } = window;

  // 1) Configure your contract (paste from Remix deployment)
  const CONTRACT_ADDRESS = "0xd0d409F68DE81b314612474bf10e0Cf98252e91a";
  const CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType":"bytes32","name":"id","type":"bytes32"},
            {"internalType":"string","name":"holderName","type":"string"},
            {"internalType":"string","name":"course","type":"string"},
            {"internalType":"uint32","name":"year","type":"uint32"},
            {"internalType":"bytes32","name":"contentHash","type":"bytes32"}
        ],
        "name":"createCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"
    },
    {
        "inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],
        "name":"deleteCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"
    },
    {
        "inputs":[
            {"internalType":"bytes32","name":"id","type":"bytes32"},
            {"internalType":"bool","name":"status","type":"bool"}
        ],
        "name":"revokeCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"
    },
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
    {
        "anonymous":false,"inputs":[
            {"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},
            {"indexed":true,"internalType":"address","name":"issuer","type":"address"}
        ],
        "name":"Created","type":"event"
    },
    {
        "anonymous":false,"inputs":[
            {"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"}
        ],
        "name":"Deleted","type":"event"
    },
    {
        "anonymous":false,"inputs":[
            {"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},
            {"indexed":false,"internalType":"bool","name":"status","type":"bool"}
        ],
        "name":"Revoked","type":"event"
    },
    {
        "inputs":[
            {"internalType":"bytes32","name":"id","type":"bytes32"},
            {"internalType":"string","name":"holderName","type":"string"},
            {"internalType":"string","name":"course","type":"string"},
            {"internalType":"uint32","name":"year","type":"uint32"},
            {"internalType":"bytes32","name":"contentHash","type":"bytes32"}
        ],
        "name":"updateCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"
    },
    {
        "anonymous":false,"inputs":[
            {"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"}
        ],
        "name":"Updated","type":"event"
    },
    {
        "inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],
        "name":"getCertificateCore","outputs":[
            {"internalType":"address","name":"issuer","type":"address"},
            {"internalType":"uint32","name":"year","type":"uint32"},
            {"internalType":"bytes32","name":"contentHash","type":"bytes32"},
            {"internalType":"bool","name":"revoked","type":"bool"},
            {"internalType":"bool","name":"present","type":"bool"}
        ],
        "stateMutability":"view","type":"function"
    },
    {
        "inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],
        "name":"getCertificateText","outputs":[
            {"internalType":"string","name":"holderName","type":"string"},
            {"internalType":"string","name":"course","type":"string"}
        ],
        "stateMutability":"view","type":"function"
    },
    {
        "inputs":[],"name":"owner","outputs":[
            {"internalType":"address","name":"","type":"address"}
        ],
        "stateMutability":"view","type":"function"
    },
    {
        "inputs":[
            {"internalType":"bytes32","name":"id","type":"bytes32"},
            {"internalType":"bytes32","name":"contentHash","type":"bytes32"}
        ],
        "name":"verify","outputs":[{"internalType":"bool","name":"","type":"bool"}],
        "stateMutability":"view","type":"function"
    }
];

  // 2) Ethers provider/signer setup
  const connectBtn = document.getElementById("connectBtn");
  const accountLabel = document.getElementById("accountLabel");

  let provider, signer, signerAddress, contractWrite, contractRead;

  async function ensureProvider() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    contractRead = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }

  async function connect() {
    await ensureProvider();
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    signerAddress = await signer.getAddress();
    contractWrite = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    accountLabel.textContent = `Connected: ${shorten(signerAddress)}`;
  }

  connectBtn.addEventListener("click", connect);

  function shorten(a) { return a ? a.slice(0,6) + "..." + a.slice(-4) : ""; }

  // 3) Helpers: hashing & ID
  function hashText(text) {
    const bytes = ethers.utils.toUtf8Bytes(text);
    return ethers.utils.keccak256(bytes);
  }
  function buildCertId(holderName, rollNo, course, year, issuer) {
    return ethers.utils.solidityKeccak256(
      ["string","string","string","uint32","address"],
      [holderName, rollNo, course, Number(year), issuer]
    );
  }

  // 4) Admin UI logic
  const a = {
    holderName: document.getElementById("a_holderName"),
    rollNo: document.getElementById("a_rollNo"),
    course: document.getElementById("a_course"),
    year: document.getElementById("a_year"),
    issuer: document.getElementById("a_issuer"),
    // file: removed
    // text: removed
    certId: document.getElementById("a_certId"),
    contentHash: document.getElementById("a_contentHash"),
    compute: document.getElementById("a_compute"),
    create: document.getElementById("a_create"),
    update: document.getElementById("a_update"),
    revoke: document.getElementById("a_revoke"),
    unrevoke: document.getElementById("a_unrevoke"),
    del: document.getElementById("a_delete"),
    log: document.getElementById("a_log"),
  };

  a.compute.addEventListener("click", async () => {
    try {
      const issuerAddr = a.issuer.value || signerAddress || "";
      const id = buildCertId(a.holderName.value, a.rollNo.value, a.course.value, a.year.value, issuerAddr);
      // Deterministic content hash from fields
      const cHash = hashText(JSON.stringify({
        holderName: a.holderName.value,
        rollNo: a.rollNo.value,
        course: a.course.value,
        year: Number(a.year.value),
        issuer: issuerAddr
      }));
      a.certId.value = id;
      a.contentHash.value = cHash;
      a.log.textContent = `Computed\nid: ${id}\ncontentHash: ${cHash}`;
    } catch (e) { a.log.textContent = `Compute error: ${e.message}`; }
  });

  a.create.addEventListener("click", async () => {
    try {
      if (!signer) await connect();
      const issuerAddr = a.issuer.value || signerAddress;
      const id = a.certId.value || buildCertId(a.holderName.value, a.rollNo.value, a.course.value, a.year.value, issuerAddr);
      const cHash = a.contentHash.value;
      const tx = await contractWrite.createCertificate(id, a.holderName.value, a.course.value, Number(a.year.value), cHash);
      a.log.textContent = `Creating... ${tx.hash}`;
      await tx.wait();
      a.log.textContent = `Created: ${tx.hash}`;
    } catch (e) { a.log.textContent = `Create error: ${e.message}`; }
  });

  a.update.addEventListener("click", async () => {
    try {
      if (!signer) await connect();
      const issuerAddr = a.issuer.value || signerAddress;
      const id = a.certId.value || buildCertId(a.holderName.value, a.rollNo.value, a.course.value, a.year.value, issuerAddr);
      const cHash = a.contentHash.value;
      const tx = await contractWrite.updateCertificate(id, a.holderName.value, a.course.value, Number(a.year.value), cHash);
      a.log.textContent = `Updating... ${tx.hash}`;
      await tx.wait();
      a.log.textContent = `Updated: ${tx.hash}`;
    } catch (e) { a.log.textContent = `Update error: ${e.message}`; }
  });

  a.revoke.addEventListener("click", async () => {
    try {
      if (!signer) await connect();
      const id = a.certId.value;
      const tx = await contractWrite.revokeCertificate(id, true);
      a.log.textContent = `Revoking... ${tx.hash}`;
      await tx.wait();
      a.log.textContent = `Revoked: ${tx.hash}`;
    } catch (e) { a.log.textContent = `Revoke error: ${e.message}`; }
  });

  a.unrevoke.addEventListener("click", async () => {
    try {
      if (!signer) await connect();
      const id = a.certId.value;
      const tx = await contractWrite.revokeCertificate(id, false);
      a.log.textContent = `Unrevoking... ${tx.hash}`;
      await tx.wait();
      a.log.textContent = `Unrevoked: ${tx.hash}`;
    } catch (e) { a.log.textContent = `Unrevoke error: ${e.message}`; }
  });

  a.del.addEventListener("click", async () => {
    try {
      if (!signer) await connect();
      const id = a.certId.value;
      const tx = await contractWrite.deleteCertificate(id);
      a.log.textContent = `Deleting... ${tx.hash}`;
      await tx.wait();
      a.log.textContent = `Deleted: ${tx.hash}`;
    } catch (e) { a.log.textContent = `Delete error: ${e.message}`; }
  });

  // 5) User Verify UI logic
  const u = {
    holderName: document.getElementById("u_holderName"),
    rollNo: document.getElementById("u_rollNo"),
    course: document.getElementById("u_course"),
    year: document.getElementById("u_year"),
    issuer: document.getElementById("u_issuer"),
    // file: removed
    // text: removed
    compute: document.getElementById("u_compute"),
    certId: document.getElementById("u_certId"),
    contentHash: document.getElementById("u_contentHash"),
    verifyBtn: document.getElementById("u_verify"),
    result: document.getElementById("u_result"),
    log: document.getElementById("u_log"),
  };

  u.compute.addEventListener("click", async () => {
    try {
      const id = buildCertId(u.holderName.value, u.rollNo.value, u.course.value, u.year.value, u.issuer.value);
      // Deterministic content hash from fields
      const cHash = hashText(JSON.stringify({
        holderName: u.holderName.value,
        rollNo: u.rollNo.value,
        course: u.course.value,
        year: Number(u.year.value),
        issuer: u.issuer.value
      }));
      u.certId.value = id;
      u.contentHash.value = cHash;
      u.log.textContent = `Computed\nid: ${id}\ncontentHash: ${cHash}`;
    } catch (e) { u.log.textContent = `Compute error: ${e.message}`; }
  });

  u.verifyBtn.addEventListener("click", async () => {
    try {
      await ensureProvider(); // read-only ok (no signer needed)
      const ok = await contractRead.verify(u.certId.value, u.contentHash.value);
      u.result.textContent = ok ? "Result: VALID" : "Result: INVALID";
      u.result.className = ok ? "badge ok" : "badge fail";
      // Optional debug: show core/text info
      const core = await contractRead.getCertificateCore(u.certId.value);
      const text = await contractRead.getCertificateText(u.certId.value);
      u.log.textContent = `Verify: ${ok}\npresent: ${core.present}\nrevoked: ${core.revoked}\nissuer: ${core.issuer}\nname: ${text.holderName}\ncourse: ${text.course}`;
    } catch (e) { u.log.textContent = `Verify error: ${e.message}`; }
  });

  // Auto-init read-only provider for quick verify without connect
  await ensureProvider().catch(()=>{});
})();
