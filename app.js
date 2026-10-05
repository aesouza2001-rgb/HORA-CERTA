const SUPABASE_URL = "https://kmngoqtintgjgujsznib.supabase.co";
const SUPABASE_KEY = "sb_publishable_BwJkMJuIlL8jroYtQO1OqA_kz_DruZG";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let employee = null;
let company = null;
let punches = [];


/* =========================
   UTILIDADES
========================= */

const $ = (id) => document.getElementById(id);

function todayKey() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function fmtTime(date) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function fmtDate(date) {
  return new Date(date).toLocaleDateString("pt-BR");
}


/* =========================
   LOGIN
========================= */

function showLogin(message = "") {

  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:#f4f7fa;
      font-family:Arial,sans-serif;
    ">

      <div style="
        width:100%;
        max-width:400px;
        background:white;
        padding:30px;
        border-radius:18px;
        box-shadow:0 10px 30px rgba(0,0,0,.08);
      ">

        <div style="
          text-align:center;
          font-size:28px;
          font-weight:800;
          color:#163b5c;
          margin-bottom:8px;
        ">
          HORA CERTA
        </div>

        <div style="
          text-align:center;
          color:#666;
          margin-bottom:25px;
        ">
          Seu ponto. Sua jornada. Seu controle.
        </div>

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        ">
          E-mail
        </label>

        <input
          id="loginEmail"
          type="email"
          placeholder="seu@email.com"
          style="
            width:100%;
            box-sizing:border-box;
            padding:13px;
            border:1px solid #ddd;
            border-radius:10px;
            margin-bottom:15px;
          "
        >

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        ">
          Senha
        </label>

        <input
          id="loginPassword"
          type="password"
          placeholder="Sua senha"
          style="
            width:100%;
            box-sizing:border-box;
            padding:13px;
            border:1px solid #ddd;
            border-radius:10px;
            margin-bottom:10px;
          "
        >

        <button
          id="loginBtn"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:10px;
            background:#163b5c;
            color:white;
            font-size:16px;
            font-weight:700;
            cursor:pointer;
            margin-top:8px;
          "
        >
          ENTRAR
        </button>

        <button
          id="forgotBtn"
          style="
            width:100%;
            margin-top:14px;
            border:0;
            background:none;
            color:#163b5c;
            cursor:pointer;
            font-size:14px;
          "
        >
          Esqueci minha senha
        </button>

        <div
          id="loginMessage"
          style="
            margin-top:15px;
            text-align:center;
            color:#c0392b;
            min-height:20px;
          "
        >
          ${message}
        </div>

      </div>
    </div>
  `;

  $("loginBtn").onclick = login;
  $("forgotBtn").onclick = showForgotPassword;
}


/* =========================
   LOGIN
========================= */

async function login() {

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!email || !password) {

    $("loginMessage").textContent =
      "Digite seu e-mail e sua senha.";

    return;
  }

  $("loginBtn").disabled = true;
  $("loginBtn").textContent = "ENTRANDO...";
  $("loginMessage").textContent = "";

  const { data, error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    $("loginMessage").textContent =
      "Não foi possível entrar: " + error.message;

    $("loginBtn").disabled = false;
    $("loginBtn").textContent = "ENTRAR";

    return;
  }

  await loadEmployee(data.user.id);
}


/* =========================
   ESQUECI SENHA
========================= */

function showForgotPassword() {

  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:#f4f7fa;
      font-family:Arial,sans-serif;
    ">

      <div style="
        width:100%;
        max-width:400px;
        background:white;
        padding:30px;
        border-radius:18px;
        box-shadow:0 10px 30px rgba(0,0,0,.08);
      ">

        <div style="
          text-align:center;
          font-size:28px;
          font-weight:800;
          color:#163b5c;
          margin-bottom:8px;
        ">
          HORA CERTA
        </div>

        <h2 style="
          text-align:center;
          margin-top:25px;
        ">
          Recuperar senha
        </h2>

        <p style="
          text-align:center;
          color:#666;
          line-height:1.5;
        ">
          Digite seu e-mail e enviaremos um link
          para criar uma nova senha.
        </p>

        <input
          id="resetEmail"
          type="email"
          placeholder="seu@email.com"
          style="
            width:100%;
            box-sizing:border-box;
            padding:13px;
            border:1px solid #ddd;
            border-radius:10px;
            margin:15px 0;
          "
        >

        <button
          id="sendResetBtn"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:10px;
            background:#163b5c;
            color:white;
            font-size:16px;
            font-weight:700;
            cursor:pointer;
          "
        >
          ENVIAR LINK
        </button>

        <button
          id="backLoginBtn"
          style="
            width:100%;
            margin-top:14px;
            border:0;
            background:none;
            color:#163b5c;
            cursor:pointer;
          "
        >
          Voltar para o login
        </button>

        <div
          id="resetMessage"
          style="
            margin-top:15px;
            text-align:center;
            min-height:25px;
          "
        ></div>

      </div>
    </div>
  `;

  $("sendResetBtn").onclick =
    sendPasswordReset;

  $("backLoginBtn").onclick =
    showLogin;
}


async function sendPasswordReset() {

  const email =
    $("resetEmail").value.trim();

  if (!email) {

    $("resetMessage").textContent =
      "Digite seu e-mail.";

    $("resetMessage").style.color =
      "#c0392b";

    return;
  }

  $("sendResetBtn").disabled = true;
  $("sendResetBtn").textContent =
    "ENVIANDO...";

  const redirectTo =
    window.location.origin + window.location.pathname;

  const { error } =
    await db.auth.resetPasswordForEmail(
      email,
      {
        redirectTo
      }
    );

  if (error) {

    $("resetMessage").textContent =
      "Erro: " + error.message;

    $("resetMessage").style.color =
      "#c0392b";

    $("sendResetBtn").disabled = false;
    $("sendResetBtn").textContent =
      "ENVIAR LINK";

    return;
  }

  $("resetMessage").textContent =
    "✅ Link enviado! Verifique seu e-mail.";

  $("resetMessage").style.color =
    "#198754";

  $("sendResetBtn").disabled = false;
  $("sendResetBtn").textContent =
    "ENVIAR LINK";
}


/* =========================
   NOVA SENHA
========================= */

function showUpdatePassword() {

  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:#f4f7fa;
      font-family:Arial,sans-serif;
    ">

      <div style="
        width:100%;
        max-width:400px;
        background:white;
        padding:30px;
        border-radius:18px;
        box-shadow:0 10px 30px rgba(0,0,0,.08);
      ">

        <div style="
          text-align:center;
          font-size:28px;
          font-weight:800;
          color:#163b5c;
        ">
          HORA CERTA
        </div>

        <h2 style="text-align:center;margin-top:25px">
          Criar nova senha
        </h2>

        <p style="
          text-align:center;
          color:#666;
        ">
          Digite sua nova senha abaixo.
        </p>

        <input
          id="newPassword"
          type="password"
          placeholder="Nova senha"
          style="
            width:100%;
            box-sizing:border-box;
            padding:13px;
            border:1px solid #ddd;
            border-radius:10px;
            margin:15px 0 10px;
          "
        >

        <input
          id="confirmPassword"
          type="password"
          placeholder="Confirme a nova senha"
          style="
            width:100%;
            box-sizing:border-box;
            padding:13px;
            border:1px solid #ddd;
            border-radius:10px;
            margin-bottom:15px;
          "
        >

        <button
          id="updatePasswordBtn"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:10px;
            background:#163b5c;
            color:white;
            font-size:16px;
            font-weight:700;
            cursor:pointer;
          "
        >
          SALVAR NOVA SENHA
        </button>

        <div
          id="updateMessage"
          style="
            margin-top:15px;
            text-align:center;
            min-height:25px;
          "
        ></div>

      </div>
    </div>
  `;

  $("updatePasswordBtn").onclick =
    updatePassword;
}


async function updatePassword() {

  const password =
    $("newPassword").value;

  const confirm =
    $("confirmPassword").value;

  if (!password || !confirm) {

    $("updateMessage").textContent =
      "Preencha os dois campos.";

    $("updateMessage").style.color =
      "#c0392b";

    return;
  }

  if (password.length < 6) {

    $("updateMessage").textContent =
      "A senha precisa ter pelo menos 6 caracteres.";

    $("updateMessage").style.color =
      "#c0392b";

    return;
  }

  if (password !== confirm) {

    $("updateMessage").textContent =
      "As senhas não são iguais.";

    $("updateMessage").style.color =
      "#c0392b";

    return;
  }

  $("updatePasswordBtn").disabled = true;
  $("updatePasswordBtn").textContent =
    "SALVANDO...";

  const { error } =
    await db.auth.updateUser({
      password
    });

  if (error) {

    $("updateMessage").textContent =
      "Erro: " + error.message;

    $("updateMessage").style.color =
      "#c0392b";

    $("updatePasswordBtn").disabled = false;
    $("updatePasswordBtn").textContent =
      "SALVAR NOVA SENHA";

    return;
  }

  $("updateMessage").textContent =
    "✅ Senha alterada com sucesso!";

  $("updateMessage").style.color =
    "#198754";

  setTimeout(() => {
    loadCurrentSession();
  }, 1500);
}


/* =========================
   FUNCIONÁRIO
========================= */

async function loadEmployee(userId) {

  const { data, error } =
    await db
      .from("employees")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .single();

  if (error || !data) {

    await db.auth.signOut();

    showLogin(
      "Usuário autenticado, mas funcionário não encontrado."
    );

    return;
  }

  employee = data;

  await loadCompany();
  await loadPunches();

  renderApp();
}


/* =========================
   EMPRESA
========================= */

async function loadCompany() {

  const { data, error } =
    await db
      .from("companies")
      .select("*")
      .eq("id", employee.company_id)
      .single();

  if (!error) {
    company = data;
  }
}


/* =========================
   PONTOS
========================= */

async function loadPunches() {

  const { data, error } =
    await db
      .from("punches")
      .select("*")
      .eq("employee_id", employee.id)
      .order("timestamp", {
        ascending:true
      });

  if (!error) {
    punches = data || [];
  } else {
    console.error(error);
    punches = [];
  }
}


/* =========================
   APP
========================= */

function renderApp() {

  document.body.innerHTML = `
    <div id="app">

      <header style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:18px;
      ">

        <div>

          <div class="brand">
            HORA CERTA
          </div>

          <div class="sub">
            ${company?.name || "Empresa"}
          </div>

        </div>

        <button
          id="logoutBtn"
          class="ghost"
        >
          Sair
        </button>

      </header>


      <main>

        <section
          class="screen active"
        >

          <div class="hello">
            Olá,
            <span>
              ${employee.name}
            </span>
            👋
          </div>

          <div class="date">
            ${new Date().toLocaleDateString(
              "pt-BR",
              {
                weekday:"long",
                day:"2-digit",
                month:"long",
                year:"numeric"
              }
            )}
          </div>

          <div
            class="clock"
            id="clock"
          >
            --:--:--
          </div>


          <div class="card punch-card">

            <div
              class="location"
              id="locationStatus"
            >
              📍 Localização será solicitada
            </div>

            <button
              id="punchBtn"
              class="punch"
            >
              REGISTRAR ENTRADA
            </button>

            <div class="hint">
              O registro salva data,
              hora e localização.
            </div>

          </div>


          <div class="grid2">

            <div class="stat">

              <span>
                Registros hoje
              </span>

              <strong id="todayCount">
                0
              </strong>

            </div>


            <div class="stat">

              <span>
                Status
              </span>

              <strong id="statusText">
                Fora
              </strong>

            </div>

          </div>


          <div class="card">

            <h3>
              Jornada de hoje
            </h3>

            <div
              id="todayPunches"
              class="timeline"
            ></div>

          </div>

        </section>

      </main>

    </div>
  `;

  $("logoutBtn").onclick =
    logout;

  $("punchBtn").onclick =
    punch;

  updateClock();

  setInterval(
    updateClock,
    1000
  );

  renderToday();
}


/* =========================
   RELÓGIO
========================= */

function updateClock() {

  const clock =
    $("clock");

  if (clock) {

    clock.textContent =
      new Date().toLocaleTimeString(
        "pt-BR"
      );

  }
}


/* =========================
   HOJE
========================= */

function todayPunchList() {

  return punches.filter(p => {

    return String(
      p.timestamp
    ).slice(0,10) === todayKey();

  });
}


function renderToday() {

  const list =
    todayPunchList();

  $("todayCount").textContent =
    list.length;

  const working =
    list.length % 2 === 1;

  $("statusText").textContent =
    working
      ? "Trabalhando"
      : "Fora";

  $("punchBtn").textContent =
    working
      ? "REGISTRAR SAÍDA"
      : "REGISTRAR ENTRADA";


  const container =
    $("todayPunches");

  container.innerHTML = "";


  if (!list.length) {

    container.innerHTML =
      `<div class="muted">
        Nenhum registro hoje.
      </div>`;

    return;
  }


  list.forEach(
    (p,index) => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "item";

      div.innerHTML = `
        <span>
          ${
            index % 2 === 0
              ? "Entrada"
              : "Saída / intervalo"
          }
        </span>

        <strong>
          ${fmtTime(p.timestamp)}
        </strong>
      `;

      container.appendChild(
        div
      );

    }
  );
}


/* =========================
   GPS
========================= */

function getLocation() {

  return new Promise(
    (resolve) => {

      if (!navigator.geolocation) {

        resolve(null);

        return;
      }


      navigator.geolocation.getCurrentPosition(

        position => {

          resolve({

            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,

            accuracy:
              position.coords.accuracy

          });

        },

        () => {

          resolve(null);

        },

        {

          enableHighAccuracy:true,

          timeout:15000,

          maximumAge:0

        }

      );

    }
  );
}


/* =========================
   ENDEREÇO
========================= */

async function reverseGeocode(
  latitude,
  longitude
) {

  try {

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2` +
      `&lat=${encodeURIComponent(latitude)}` +
      `&lon=${encodeURIComponent(longitude)}` +
      `&zoom=18` +
      `&addressdetails=1`;

    const response =
      await fetch(url);

    if (!response.ok) {

      return null;
    }

    const data =
      await response.json();

    const a =
      data.address || {};


    return {

      street:
        a.road ||
        a.pedestrian ||
        "",

      number:
        a.house_number ||
        "",

      neighborhood:
        a.neighbourhood ||
        a.suburb ||
        "",

      city:
        a.city ||
        a.town ||
        a.municipality ||
        "",

      state:
        a.state ||
        "",

      cep:
        a.postcode ||
        "",

      display:
        data.display_name ||
        ""

    };

  } catch (error) {

    console.error(error);

    return null;
  }
}


function formatAddress(
  address
) {

  if (!address) {

    return "GPS obtido";
  }

  const line1 =
    [
      address.street,
      address.number
    ]
      .filter(Boolean)
      .join(", ");


  const line2 =
    [
      address.neighborhood,
      address.city
    ]
      .filter(Boolean)
      .join(" • ");


  const line3 =
    address.cep
      ? `CEP ${address.cep}`
      : "";


  return [
    line1,
    line2,
    line3
  ]
    .filter(Boolean)
    .join(" | ");
}


/* =========================
   REGISTRAR PONTO
========================= */

async function punch() {

  const button =
    $("punchBtn");

  button.disabled = true;

  button.textContent =
    "OBTENDO LOCALIZAÇÃO...";


  const location =
    await getLocation();


  let address = null;


  if (location) {

    $("locationStatus").textContent =
      `📍 GPS: ${
        location.latitude.toFixed(5)
      }, ${
        location.longitude.toFixed(5)
      }`;


    address =
      await reverseGeocode(
        location.latitude,
        location.longitude
      );


    if (address) {

      $("locationStatus").textContent =
        "📍 " +
        formatAddress(address);

    }

  } else {

    $("locationStatus").textContent =
      "⚠️ GPS não disponível";

  }


  const list =
    todayPunchList();


  const punchType =
    list.length % 2 === 0
      ? "entry"
      : "exit";


  const timestamp =
    new Date().toISOString();


  const payload = {

    company_id:
      employee.company_id,

    employee_id:
      employee.id,

    punch_type:
      punchType,

    timestamp,

    latitude:
      location?.latitude ?? null,

    longitude:
      location?.longitude ?? null,

    accuracy:
      location?.accuracy ?? null,

    address:
      address?.display ?? null

  };


  const {
    data,
    error
  } = await db
    .from("punches")
    .insert(payload)
    .select()
    .single();


  if (error) {

    console.error(error);

    alert(
      "Não foi possível registrar o ponto.\n\n" +
      error.message
    );

    button.disabled =
      false;

    renderToday();

    return;
  }


  punches.push(data);

  renderToday();

  button.disabled =
    false;


  $("locationStatus").textContent =
    location
      ? "📍 " +
        formatAddress(address)
      : "⚠️ Registrado sem GPS";


  alert(
    punchType === "entry"
      ? "✅ Entrada registrada!"
      : "✅ Saída registrada!"
  );
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  await db.auth.signOut();

  location.reload();
}


/* =========================
   SESSÃO / RECUPERAÇÃO
========================= */

async function loadCurrentSession() {

  const {
    data: {
      session
    }
  } = await db.auth.getSession();


  if (!session) {

    showLogin();

    return;
  }


  await loadEmployee(
    session.user.id
  );
}


/* =========================
   INICIALIZAÇÃO
========================= */

async function start() {

  /*
   * Se o usuário acabou de clicar
   * no link de recuperação, o Supabase
   * cria uma sessão temporária.
   */

  const {
    data: {
      session
    }
  } = await db.auth.getSession();


  if (session) {

    /*
     * Se chegou aqui através do fluxo
     * de recuperação, mostramos a tela
     * de nova senha.
     */

    if (
      window.location.hash.includes(
        "type=recovery"
      )
    ) {

      showUpdatePassword();

      return;
    }


    await loadEmployee(
      session.user.id
    );

    return;
  }


  showLogin();
}


/*
 * Detecta mudanças de autenticação.
 * Isso ajuda o Supabase a entregar
 * corretamente a sessão de recuperação.
 */

db.auth.onAuthStateChange(
  async (event, session) => {

    if (
      event === "PASSWORD_RECOVERY"
    ) {

      showUpdatePassword();

    }

  }
);


start();
