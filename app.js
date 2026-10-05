const SUPABASE_URL = "https://kmngoqtintgjgujsznib.supabase.co";
const SUPABASE_KEY = "sb_publishable_BwJkMJuIlL8jroYtQO1OqA_kz_DruZG";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let employee = null;
let company = null;
let punches = [];


/* =========================================================
   UTILITÁRIOS
========================================================= */

function $(id) {
  return document.getElementById(id);
}


function todayKey() {

  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}


function localDateKey(timestamp) {

  const d = new Date(timestamp);

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}


function fmtTime(timestamp) {

  return new Date(timestamp).toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


function fmtDate(date = new Date()) {

  return date.toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );

}


/* =========================================================
   LOGIN
========================================================= */

function showLogin(message = "") {

  document.body.innerHTML = `

    <div class="login-page">

      <div class="login-card">

        <h1>HORA CERTA</h1>

        <p class="subtitle">
          Controle de jornada
        </p>

        ${
          message
            ? `
              <div class="error-message">
                ${message}
              </div>
            `
            : ""
        }

        <input
          id="loginEmail"
          type="email"
          placeholder="E-mail"
          autocomplete="email"
        >

        <input
          id="loginPassword"
          type="password"
          placeholder="Senha"
          autocomplete="current-password"
        >

        <button
          onclick="login()"
          class="primary-btn"
        >
          ENTRAR
        </button>

        <button
          onclick="showForgotPassword()"
          class="link-btn"
        >
          Esqueci minha senha
        </button>

      </div>

    </div>

  `;

}


async function login() {

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;

  if (!email || !password) {

    alert(
      "Informe o e-mail e a senha."
    );

    return;

  }

  const button =
    document.querySelector(".primary-btn");

  if (button) {

    button.disabled = true;
    button.textContent = "ENTRANDO...";

  }

  const { data, error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    alert(
      "Não foi possível entrar.\n\n" +
      error.message
    );

    if (button) {

      button.disabled = false;
      button.textContent = "ENTRAR";

    }

    return;

  }

  if (data?.user) {

    await loadEmployee(data.user.id);

  }

}


/* =========================================================
   RECUPERAÇÃO DE SENHA
========================================================= */

function showForgotPassword(message = "") {

  document.body.innerHTML = `

    <div class="login-page">

      <div class="login-card">

        <h1>HORA CERTA</h1>

        <p class="subtitle">
          Recuperar senha
        </p>

        ${
          message
            ? `
              <div class="error-message">
                ${message}
              </div>
            `
            : ""
        }

        <input
          id="forgotEmail"
          type="email"
          placeholder="Seu e-mail"
          autocomplete="email"
        >

        <button
          onclick="sendPasswordReset()"
          class="primary-btn"
        >
          ENVIAR LINK
        </button>

        <button
          onclick="showLogin()"
          class="link-btn"
        >
          Voltar para login
        </button>

      </div>

    </div>

  `;

}


async function sendPasswordReset() {

  const email =
    $("forgotEmail").value.trim();

  if (!email) {

    alert(
      "Informe seu e-mail."
    );

    return;

  }

  const redirectTo =
    window.location.origin +
    window.location.pathname;

  const { error } =
    await db.auth.resetPasswordForEmail(
      email,
      {
        redirectTo
      }
    );

  if (error) {

    alert(
      "Falha ao enviar a recuperação de senha.\n\n" +
      error.message
    );

    return;

  }

  alert(
    "✅ Link de recuperação enviado para seu e-mail."
  );

  showLogin();

}


function showUpdatePassword() {

  document.body.innerHTML = `

    <div class="login-page">

      <div class="login-card">

        <h1>HORA CERTA</h1>

        <p class="subtitle">
          Criar nova senha
        </p>

        <input
          id="newPassword"
          type="password"
          placeholder="Nova senha"
          autocomplete="new-password"
        >

        <input
          id="confirmPassword"
          type="password"
          placeholder="Confirmar nova senha"
          autocomplete="new-password"
        >

        <button
          onclick="updatePassword()"
          class="primary-btn"
        >
          SALVAR NOVA SENHA
        </button>

      </div>

    </div>

  `;

}


async function updatePassword() {

  const password =
    $("newPassword").value;

  const confirm =
    $("confirmPassword").value;

  if (!password || !confirm) {

    alert(
      "Preencha os dois campos."
    );

    return;

  }

  if (password !== confirm) {

    alert(
      "As senhas não são iguais."
    );

    return;

  }

  if (password.length < 6) {

    alert(
      "A senha deve possuir pelo menos 6 caracteres."
    );

    return;

  }

  const { error } =
    await db.auth.updateUser({
      password
    });

  if (error) {

    alert(
      "Não foi possível atualizar a senha.\n\n" +
      error.message
    );

    return;

  }

  alert(
    "✅ Senha atualizada com sucesso!"
  );

  await db.auth.signOut();

  showLogin();

}


/* =========================================================
   FUNCIONÁRIO
========================================================= */

async function loadEmployee(userId) {

  const { data, error } =
    await db
      .from("employees")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .single();

  if (error || !data) {

    console.error(error);

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


/* =========================================================
   EMPRESA
========================================================= */

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


/* =========================================================
   REGISTROS
========================================================= */

async function loadPunches() {

  const { data, error } =
    await db
      .from("punches")
      .select("*")
      .eq("employee_id", employee.id)
      .order("timestamp", {
        ascending: true
      });

  if (!error) {

    punches = data || [];

  } else {

    console.error(error);

    punches = [];

  }

}


/* =========================================================
   APLICAÇÃO PRINCIPAL
========================================================= */

function renderApp() {

  document.body.innerHTML = `

    <div class="app">

      <header
        class="topbar"
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
        "
      >

        <div>

          <strong>HORA CERTA</strong>

          <span id="companyName">
            ${company?.name || "Empresa"}
          </span>

        </div>

        <button
          onclick="logout()"
          class="logout-btn"
        >
          SAIR
        </button>

      </header>


      <main
        class="container"
        style="
          text-align:center;
        "
      >

        <!-- BOAS-VINDAS -->

        <section
          class="welcome"
          style="
            text-align:center;
          "
        >

          <h2>
            Olá, ${employee.name || "Funcionário"} 👋
          </h2>

          <p>
            ${fmtDate()}
          </p>

          <!-- RELÓGIO -->

          <div
            id="clock"
            class="clock"
            style="
              margin-top:18px;
              font-size:48px;
              font-weight:800;
              letter-spacing:1px;
              line-height:1;
            "
          >
            --:--:--
          </div>


          <!-- LOCALIZAÇÃO -->

          <div
            id="locationStatus"
            class="location-status"
            style="
              margin-top:12px;
              text-align:center;
              font-size:14px;
              color:#777;
              min-height:22px;
            "
          >
            📍 Aguardando localização...
          </div>

        </section>


        <!-- STATUS -->

        <div
          id="todayStatus"
          style="
            margin:18px auto 12px;
            font-size:15px;
            font-weight:700;
            color:#555;
            text-align:center;
          "
        >
          Você está fora
        </div>


        <!-- BOTÃO PRINCIPAL -->

        <button
          id="punchBtn"
          onclick="punch()"
          class="punch-btn"
          style="
            width:100%;
            min-height:100px;
            border:none;
            border-radius:18px;
            padding:22px 18px;
            font-size:21px;
            font-weight:800;
            letter-spacing:.3px;
            cursor:pointer;
            box-shadow:0 8px 22px rgba(0,0,0,.15);
            transition:all .2s ease;
          "
        >
          🟢 REGISTRAR ENTRADA
        </button>


        <!-- BANCO DE HORAS -->

        <div
          class="card"
          style="
            margin-top:18px;
            border-left:5px solid #163b5c;
            text-align:left;
          "
        >

          <h3 style="margin-top:0;">
            🕐 Meu Banco de Horas
          </h3>


          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(3,minmax(0,1fr));
              gap:12px;
              margin-top:14px;
            "
          >

            <div class="stat">

              <span>
                Saldo acumulado
              </span>

              <strong id="bankBalance">
                +00:00
              </strong>

            </div>


            <div class="stat">

              <span>
                Trabalhado hoje
              </span>

              <strong id="workedToday">
                00:00
              </strong>

            </div>


            <div class="stat">

              <span>
                Saldo de hoje
              </span>

              <strong id="todayBalance">
                00:00
              </strong>

            </div>

          </div>


          <div
            style="
              margin-top:14px;
              color:#666;
              font-size:14px;
            "
          >

            Jornada prevista:
            <strong>08:00</strong>
            por dia

          </div>

        </div>


        <!-- BOTÃO ESPELHO -->

        <button
          onclick="openTimesheet()"
          style="
            width:100%;
            margin-top:16px;
            padding:18px;
            border:none;
            border-radius:14px;
            background:#163b5c;
            color:white;
            font-size:16px;
            font-weight:700;
            cursor:pointer;
            box-shadow:0 5px 15px rgba(0,0,0,.12);
          "
        >

          📋 MEU ESPELHO DE PONTO

          <div
            style="
              font-size:12px;
              font-weight:400;
              margin-top:5px;
              opacity:.85;
            "
          >
            Consultar jornada do mês atual
          </div>

        </button>


        <!-- JORNADA DE HOJE -->

        <section
          class="card"
          style="
            text-align:left;
          "
        >

          <h3>
            Jornada de hoje
          </h3>

          <div id="todayPunches"></div>

        </section>

      </main>

    </div>

  `;


  startClock();

  renderToday();

}


/* =========================================================
   RELÓGIO
========================================================= */

function startClock() {

  function updateClock() {

    const clock =
      $("clock");

    if (!clock) {
      return;
    }

    clock.textContent =
      new Date().toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      );

  }

  updateClock();

  setInterval(
    updateClock,
    1000
  );

}


/* =========================================================
   PONTOS DE HOJE
========================================================= */

function todayPunchList() {

  return punches
    .filter(p => {

      return (
        localDateKey(p.timestamp) ===
        todayKey()
      );

    })
    .sort(
      (a, b) =>
        new Date(a.timestamp) -
        new Date(b.timestamp)
    );

}


/* =========================================================
   BANCO DE HORAS
========================================================= */

function formatDuration(ms) {

  const negative =
    ms < 0;

  const totalMinutes =
    Math.round(
      Math.abs(ms) / 60000
    );

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  return (
    negative
      ? "-"
      : "+"
  ) +
  String(hours).padStart(2, "0") +
  ":" +
  String(minutes).padStart(2, "0");

}


function formatWorked(ms) {

  const totalMinutes =
    Math.round(
      Math.max(0, ms) / 60000
    );

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0")
  );

}


function workedMilliseconds(list) {

  let total = 0;

  for (
    let i = 0;
    i + 1 < list.length;
    i += 2
  ) {

    const start =
      new Date(
        list[i].timestamp
      ).getTime();

    const end =
      new Date(
        list[i + 1].timestamp
      ).getTime();

    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      end >= start
    ) {

      total +=
        end - start;

    }

  }

  return total;

}


function calculateBankHours() {

  const groups = {};


  punches
    .slice()
    .sort(
      (a, b) =>
        new Date(a.timestamp) -
        new Date(b.timestamp)
    )
    .forEach(p => {

      const key =
        localDateKey(
          p.timestamp
        );

      if (!groups[key]) {

        groups[key] = [];

      }

      groups[key].push(p);

    });


  const dailyExpected =
    8 *
    60 *
    60 *
    1000;


  let accumulated = 0;


  Object.keys(groups)
    .forEach(key => {

      const worked =
        workedMilliseconds(
          groups[key]
        );

      accumulated +=
        worked -
        dailyExpected;

    });


  const today =
    todayPunchList();


  const workedToday =
    workedMilliseconds(
      today
    );


  const todayBalance =
    workedToday -
    dailyExpected;


  return {

    accumulated,

    workedToday,

    todayBalance

  };

}


function renderBankHours() {

  const bank =
    calculateBankHours();


  const balance =
    $("bankBalance");

  const worked =
    $("workedToday");

  const today =
    $("todayBalance");


  if (
    !balance ||
    !worked ||
    !today
  ) {

    return;

  }


  balance.textContent =
    formatDuration(
      bank.accumulated
    );


  worked.textContent =
    formatWorked(
      bank.workedToday
    );


  today.textContent =
    formatDuration(
      bank.todayBalance
    );


  balance.style.color =
    bank.accumulated >= 0
      ? "#198754"
      : "#c0392b";


  today.style.color =
    bank.todayBalance >= 0
      ? "#198754"
      : "#c0392b";

}


/* =========================================================
   RENDERIZA JORNADA
========================================================= */

function renderToday() {

  const list =
    todayPunchList();


  const status =
    $("todayStatus");

  const button =
    $("punchBtn");

  const container =
    $("todayPunches");


  if (
    !status ||
    !button ||
    !container
  ) {

    return;

  }


  const working =
    list.length % 2 === 1;


  status.textContent =
    working
      ? "🟢 Você está trabalhando"
      : "⚪ Você está fora";


  status.style.color =
    working
      ? "#198754"
      : "#555";


  button.innerHTML =
    working
      ? "🔴 REGISTRAR SAÍDA"
      : "🟢 REGISTRAR ENTRADA";


  button.style.background =
    working
      ? "#c0392b"
      : "#163b5c";


  button.style.color =
    "#fff";


  if (list.length === 0) {

    container.innerHTML = `

      <div
        style="
          padding:20px;
          text-align:center;
          color:#777;
        "
      >
        Nenhum registro hoje.
      </div>

    `;

  } else {

    container.innerHTML =
      list.map(
        (p, index) => {

          let label;


          if (index === 0) {

            label =
              "Entrada";

          } else if (index === 1) {

            label =
              "Saída intervalo";

          } else if (index === 2) {

            label =
              "Retorno intervalo";

          } else if (index === 3) {

            label =
              "Saída";

          } else {

            label =
              index % 2 === 0
                ? "Entrada"
                : "Saída";

          }


          return `

            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                padding:12px 0;
                border-bottom:1px solid #eee;
              "
            >

              <div>

                <strong>
                  ${label}
                </strong>

                ${
                  p.address
                    ? `
                      <div
                        style="
                          font-size:12px;
                          color:#777;
                          margin-top:4px;
                        "
                      >
                        📍 ${p.address}
                      </div>
                    `
                    : ""
                }

              </div>


              <strong>
                ${fmtTime(p.timestamp)}
              </strong>

            </div>

          `;

        }
      ).join("");

  }


  renderBankHours();

}


/* =========================================================
   ESPELHO DE PONTO
========================================================= */

function getCurrentMonthPunches() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    now.getMonth();


  return punches
    .filter(p => {

      const d =
        new Date(
          p.timestamp
        );

      return (
        d.getFullYear() === year &&
        d.getMonth() === month
      );

    })
    .sort(
      (a, b) =>
        new Date(a.timestamp) -
        new Date(b.timestamp)
    );

}


function groupPunchesByDay(list) {

  const groups = {};


  list.forEach(p => {

    const key =
      localDateKey(
        p.timestamp
      );


    if (!groups[key]) {

      groups[key] = [];

    }


    groups[key].push(p);

  });


  return groups;

}


function monthName(date) {

  return date.toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric"
    }
  );

}


function formatDayName(date) {

  return date.toLocaleDateString(
    "pt-BR",
    {
      weekday: "long"
    }
  );

}


function formatDayNumber(date) {

  return String(
    date.getDate()
  ).padStart(2, "0");

}


function openTimesheet() {

  const monthPunches =
    getCurrentMonthPunches();


  const groups =
    groupPunchesByDay(
      monthPunches
    );


  const now =
    new Date();


  const year =
    now.getFullYear();

  const month =
    now.getMonth();


  const lastDay =
    new Date(
      year,
      month + 1,
      0
    );


  let monthlyWorked =
    0;


  let monthlyExpected =
    0;


  let rows = "";


  for (
    let day = 1;
    day <= lastDay.getDate();
    day++
  ) {

    const date =
      new Date(
        year,
        month,
        day
      );


    if (date > now) {

      break;

    }


    const key =
      [
        year,
        String(month + 1)
          .padStart(2, "0"),
        String(day)
          .padStart(2, "0")
      ].join("-");


    const dayPunches =
      groups[key] || [];


    const worked =
      workedMilliseconds(
        dayPunches
      );


    if (dayPunches.length > 0) {

      monthlyExpected +=
        8 *
        60 *
        60 *
        1000;

      monthlyWorked +=
        worked;

    }


    const balance =
      worked -
      (
        dayPunches.length > 0
          ? 8 *
            60 *
            60 *
            1000
          : 0
      );


    const dateLabel =
      formatDayNumber(
        date
      );


    const dayLabel =
      formatDayName(
        date
      );


    let times = [
      "--:--",
      "--:--",
      "--:--",
      "--:--"
    ];


    dayPunches
      .slice(0, 4)
      .forEach(
        (p, index) => {

          times[index] =
            fmtTime(
              p.timestamp
            );

        }
      );


    let statusText =
      "Sem registros";


    if (dayPunches.length > 0) {

      statusText =
        dayPunches.length >= 4
          ? "Jornada registrada"
          : "Jornada incompleta";

    }


    const balanceText =
      dayPunches.length > 0
        ? formatDuration(
            balance
          )
        : "--:--";


    const balanceColor =
      dayPunches.length === 0
        ? "#777"
        : balance >= 0
          ? "#198754"
          : "#c0392b";


    rows += `

      <div
        style="
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:14px;
          padding:16px;
          margin-bottom:12px;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:12px;
          "
        >

          <div>

            <strong
              style="
                font-size:16px;
                text-transform:capitalize;
              "
            >
              ${dateLabel}
              -
              ${dayLabel}
            </strong>

            <div
              style="
                font-size:12px;
                color:#777;
                margin-top:3px;
              "
            >
              ${statusText}
            </div>

          </div>


          <strong
            style="
              color:${balanceColor};
              font-size:16px;
            "
          >
            ${balanceText}
          </strong>

        </div>


        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(4,minmax(0,1fr));
            gap:6px;
          "
        >

          <div
            style="
              background:#f5f7fa;
              padding:9px 5px;
              border-radius:8px;
              text-align:center;
            "
          >

            <div
              style="
                font-size:10px;
                color:#777;
              "
            >
              ENTRADA
            </div>

            <strong>
              ${times[0]}
            </strong>

          </div>


          <div
            style="
              background:#f5f7fa;
              padding:9px 5px;
              border-radius:8px;
              text-align:center;
            "
          >

            <div
              style="
                font-size:10px;
                color:#777;
              "
            >
              INTERVALO
            </div>

            <strong>
              ${times[1]}
            </strong>

          </div>


          <div
            style="
              background:#f5f7fa;
              padding:9px 5px;
              border-radius:8px;
              text-align:center;
            "
          >

            <div
              style="
                font-size:10px;
                color:#777;
              "
            >
              RETORNO
            </div>

            <strong>
              ${times[2]}
            </strong>

          </div>


          <div
            style="
              background:#f5f7fa;
              padding:9px 5px;
              border-radius:8px;
              text-align:center;
            "
          >

            <div
              style="
                font-size:10px;
                color:#777;
              "
            >
              SAÍDA
            </div>

            <strong>
              ${times[3]}
            </strong>

          </div>

        </div>


        ${
          dayPunches.length > 0
            ? `
              <div
                style="
                  margin-top:12px;
                  padding-top:10px;
                  border-top:1px solid #eee;
                  display:flex;
                  justify-content:space-between;
                  font-size:13px;
                "
              >

                <span>
                  Total trabalhado
                </span>

                <strong>
                  ${formatWorked(worked)}
                </strong>

              </div>
            `
            : ""
        }

      </div>

    `;

  }


  const monthlyBalance =
    monthlyWorked -
    monthlyExpected;


  document.body.insertAdjacentHTML(
    "beforeend",
    `

      <div
        id="timesheetOverlay"
        style="
          position:fixed;
          inset:0;
          background:rgba(0,0,0,.55);
          z-index:9999;
          overflow-y:auto;
          padding:20px;
        "
      >

        <div
          style="
            max-width:760px;
            margin:20px auto;
            background:#f5f7fa;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 20px 60px rgba(0,0,0,.25);
          "
        >

          <div
            style="
              background:#163b5c;
              color:white;
              padding:22px;
              position:sticky;
              top:0;
              z-index:2;
            "
          >

            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
              "
            >

              <div>

                <div
                  style="
                    font-size:12px;
                    opacity:.8;
                    margin-bottom:5px;
                  "
                >
                  HORA CERTA
                </div>

                <h2
                  style="
                    margin:0;
                    font-size:22px;
                  "
                >
                  📋 Meu Espelho de Ponto
                </h2>

                <div
                  style="
                    margin-top:5px;
                    text-transform:capitalize;
                    opacity:.9;
                  "
                >
                  ${monthName(now)}
                </div>

              </div>


              <button
                onclick="closeTimesheet()"
                style="
                  border:none;
                  background:rgba(255,255,255,.15);
                  color:white;
                  width:40px;
                  height:40px;
                  border-radius:50%;
                  font-size:20px;
                  cursor:pointer;
                "
              >
                ×
              </button>

            </div>


            <div
              style="
                margin-top:18px;
                background:rgba(255,255,255,.1);
                border-radius:12px;
                padding:14px;
                display:flex;
                justify-content:space-between;
                align-items:center;
              "
            >

              <span>
                Saldo do mês
              </span>

              <strong
                style="
                  font-size:22px;
                  color:${monthlyBalance >= 0 ? "#7dffad" : "#ff9b9b"};
                "
              >
                ${formatDuration(monthlyBalance)}
              </strong>

            </div>

          </div>


          <div
            style="
              padding:18px;
            "
          >

            ${rows || `

              <div
                style="
                  background:white;
                  border-radius:14px;
                  padding:30px;
                  text-align:center;
                  color:#777;
                "
              >
                Nenhum registro encontrado
                neste mês.
              </div>

            `}

          </div>

        </div>

      </div>

    `
  );

}


function closeTimesheet() {

  const overlay =
    $("timesheetOverlay");

  if (overlay) {

    overlay.remove();

  }

}


/* =========================================================
   GPS
========================================================= */

function getLocation() {

  return new Promise(
    resolve => {

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

        error => {

          console.warn(
            "GPS:",
            error
          );

          resolve(null);

        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }

      );

    }
  );

}


/* =========================================================
   ENDEREÇO
========================================================= */

async function reverseGeocode(
  latitude,
  longitude
) {

  try {

    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      `?lat=${latitude}` +
      `&lon=${longitude}` +
      "&format=json" +
      "&zoom=18" +
      "&addressdetails=1";


    const response =
      await fetch(
        url,
        {
          headers: {
            "Accept":
              "application/json"
          }
        }
      );


    if (!response.ok) {

      return null;

    }


    return await response.json();

  } catch (error) {

    console.error(
      "Erro no endereço:",
      error
    );

    return null;

  }

}


function formatAddress(address) {

  if (!address) {

    return "Localização obtida";

  }


  const a =
    address.address || {};


  const parts = [];


  if (a.road) {

    let road =
      a.road;

    if (a.house_number) {

      road +=
        ", " +
        a.house_number;

    }

    parts.push(
      road
    );

  }


  if (a.suburb) {

    parts.push(
      a.suburb
    );

  }


  if (
    a.city ||
    a.town ||
    a.village
  ) {

    parts.push(
      a.city ||
      a.town ||
      a.village
    );

  }


  if (a.state) {

    parts.push(
      a.state
    );

  }


  return (
    parts.length
      ? parts.join(" - ")
      : address.display_name ||
        "Localização obtida"
  );

}


/* =========================================================
   REGISTRAR PONTO
========================================================= */

async function punch() {

  const button =
    $("punchBtn");


  button.disabled = true;

  button.textContent =
    "📍 OBTENDO LOCALIZAÇÃO...";


  const location =
    await getLocation();


  let address = null;


  if (location) {

    $("locationStatus").textContent =
      `📍 GPS: ` +
      `${location.latitude.toFixed(5)}, ` +
      `${location.longitude.toFixed(5)}`;


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
  } =
    await db
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


    button.disabled = false;

    renderToday();

    return;

  }


  punches.push(data);


  renderToday();


  button.disabled = false;


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


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  await db.auth.signOut();

  location.reload();

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function start() {

  const {
    data,
    error
  } =
    await db.auth.getSession();


  if (error) {

    console.error(error);

    showLogin();

    return;

  }


  const hash =
    window.location.hash || "";


  const search =
    window.location.search || "";


  const isRecovery =
    hash.includes(
      "type=recovery"
    ) ||
    search.includes(
      "type=recovery"
    );


  if (
    isRecovery &&
    data?.session
  ) {

    showUpdatePassword();

    return;

  }


  if (data?.session?.user) {

    await loadEmployee(
      data.session.user.id
    );

    return;

  }


  showLogin();

}


/* =========================================================
   LISTENER DE AUTENTICAÇÃO
========================================================= */

db.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    console.log(
      "Auth event:",
      event
    );


    if (
      event ===
      "PASSWORD_RECOVERY"
    ) {

      showUpdatePassword();

      return;

    }

  }
);


/* =========================================================
   INICIAR
========================================================= */

start();
