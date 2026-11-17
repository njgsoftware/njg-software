
/* =========================================================
   NJG SOFTWARE — CONTACT FORM
   Arquivo: js/contact.js
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* 01. CONFIGURAÇÃO COMERCIAL */

  // Substitua pelo número comercial da NJG Software.
  // Formato: 55 + DDD + número.
  // Exemplo fictício: 5531999999999

  const WHATSAPP_NUMBER = "5531971433993";

  /* 02. ELEMENTOS */

  const form = document.querySelector("#project-form");
  const submitButton = document.querySelector("#submit-project");
  const feedback = document.querySelector("#form-feedback");

  if (!form || !submitButton || !feedback) return;

  /* 03. VERIFICAÇÃO DO WHATSAPP */

  function getWhatsAppNumber() {
    return WHATSAPP_NUMBER.replace(/\D/g, "");
  }

  function isWhatsAppConfigured() {
    const number = getWhatsAppNumber();

    // Brasil: 55 + DDD + telefone de 8 ou 9 dígitos.
    return /^55[1-9]\d{9,10}$/.test(number);
  }

  function updateButtonState() {
    const configured = isWhatsAppConfigured();

    submitButton.disabled = !configured;

    feedback.classList.remove("error", "success");

    if (!configured) {
      feedback.textContent =
        "Este canal ainda está sendo configurado.";
    } else {
      feedback.textContent =
        "Ao continuar, o WhatsApp será aberto com sua mensagem pronta para revisão.";
    }
  }

  /* 04. LIMPEZA DOS DADOS */

  function cleanValue(value, maxLength = 500) {
    return String(value || "")
      .trim()
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .slice(0, maxLength);
  }

  function cleanDescription(value) {
    return String(value || "")
      .trim()
      .replace(/\r\n/g, "\n")
      .slice(0, 1500);
  }

  /* 05. COLETA DOS CAMPOS */

  function getFormData() {
    const data = new FormData(form);

    return {
      name: cleanValue(data.get("clientName"), 100),
      company: cleanValue(data.get("companyName"), 120),
      email: cleanValue(data.get("clientEmail"), 254),
      phone: cleanValue(data.get("clientPhone"), 25),

      projectType: cleanValue(data.get("projectType"), 100),
      description: cleanDescription(
        data.get("projectDescription")
      ),

      budget: cleanValue(
        data.get("projectBudget"),
        100
      ) || "Não informado",

      timeline: cleanValue(
        data.get("projectTimeline"),
        100
      ) || "Não informado"
    };
  }

  /* 06. CONSTRUÇÃO DA MENSAGEM */

  function buildWhatsAppMessage(data) {
    const lines = [
      "Olá! Gostaria de solicitar uma proposta à NJG Software.",
      "",
      "*NOVO PROJETO — NJG SOFTWARE*",
      "",
      "*DADOS DE CONTATO*",
      `Nome: ${data.name}`,
      `Empresa: ${data.company}`,
      `E-mail: ${data.email}`,
      `Telefone: ${data.phone || "Não informado"}`,
      "",
      "*SOBRE O PROJETO*",
      `Solução desejada: ${data.projectType}`,
      "",
      "*Descrição:*",
      data.description,
      "",
      "*INFORMAÇÕES ADICIONAIS*",
      `Investimento previsto: ${data.budget}`,
      `Prazo: ${data.timeline}`,
      "",
      "Aguardo seu retorno. Obrigado!"
    ];

    return lines.join("\n");
  }

  /* 07. FEEDBACK */

  function showFeedback(message, type = "") {
    feedback.textContent = message;

    feedback.classList.remove("error", "success");

    if (type) {
      feedback.classList.add(type);
    }
  }

  /* 08. ENVIO PARA WHATSAPP */

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isWhatsAppConfigured()) {
      showFeedback(
        "O canal de WhatsApp ainda não foi configurado.",
        "error"
      );
      return;
    }

    if (!form.reportValidity()) {
      showFeedback(
        "Verifique os campos obrigatórios antes de continuar.",
        "error"
      );
      return;
    }

    const data = getFormData();

    if (
      !data.name ||
      !data.company ||
      !data.email ||
      !data.projectType ||
      !data.description
    ) {
      showFeedback(
        "Preencha todas as informações obrigatórias.",
        "error"
      );
      return;
    }

    const message = buildWhatsAppMessage(data);

    const url = new URL(
      `https://wa.me/${getWhatsAppNumber()}`
    );

    url.searchParams.set("text", message);

    // A abertura ocorre diretamente após o clique.
    // Isso reduz a chance de bloqueio pelo navegador.
    const newWindow = window.open(
      url.toString(),
      "_blank",
      "noopener,noreferrer"
    );

    if (newWindow) {
      showFeedback(
        "WhatsApp aberto. Revise e envie sua mensagem para concluir o contato.",
        "success"
      );
    } else {
      // Caso o navegador bloqueie a nova aba.
      showFeedback(
        "Se o WhatsApp não abriu, permita pop-ups para este site e tente novamente.",
        "error"
      );
    }
  });

  /* 09. INICIALIZAÇÃO */

  updateButtonState();

  console.info(
    "NJG Software: formulário de contato inicializado."
  );

});
