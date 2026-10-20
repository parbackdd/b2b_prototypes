const steps = [...document.querySelectorAll(".step")];
const panels = [...document.querySelectorAll(".panel")];
const generateButton = document.querySelector("#generate-button");
const resetButton = document.querySelector("#reset-button");
const draftEmpty = document.querySelector("#draft-empty");
const generationState = document.querySelector("#generation-state");
const generationMessage = document.querySelector("#generation-message");
const progressBar = document.querySelector("#progress-bar");
const draftContent = document.querySelector("#draft-content");
const reviewLocked = document.querySelector("#review-locked");
const reviewContent = document.querySelector("#review-content");
const reviewState = document.querySelector("#review-state");
const editButton = document.querySelector("#edit-button");
const reportDocument = document.querySelector("#report-document");
const checks = [...document.querySelectorAll(".approval-check")];
const approveButton = document.querySelector("#approve-button");
const changesButton = document.querySelector("#changes-button");
const reviewComment = document.querySelector("#review-comment");
const workflowStatus = document.querySelector("#workflow-status");
const workflowDetail = document.querySelector("#workflow-detail");
const toast = document.querySelector("#toast");

let generated = false;
let editing = false;
let toastTimer;

function showPanel(panelId) {
  panels.forEach((panel) => panel.classList.toggle("is-visible", panel.id === panelId));
  steps.forEach((step) => step.classList.toggle("is-active", step.dataset.target === panelId));
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function setWorkflow(status, detail, state = "ready") {
  workflowStatus.textContent = status;
  workflowDetail.textContent = detail;
  const dot = document.querySelector(".status-dot");
  const colors = {
    ready: ["var(--green)", "var(--green-soft)"],
    active: ["var(--purple-500)", "var(--purple-100)"],
    warning: ["var(--amber)", "var(--amber-soft)"],
    approved: ["var(--green)", "var(--green-soft)"]
  };
  const [color, halo] = colors[state];
  dot.style.background = color;
  dot.style.boxShadow = `0 0 0 5px ${halo}`;
}

function markStep(index, complete) {
  steps[index].classList.toggle("is-complete", complete);
}

steps.forEach((step, index) => {
  step.addEventListener("click", () => {
    if (index > 0 && !generated) {
      showToast("Generate the report draft to continue.");
      return;
    }
    showPanel(step.dataset.target);
  });
});

generateButton.addEventListener("click", async () => {
  generateButton.disabled = true;
  showPanel("draft-panel");
  draftEmpty.hidden = true;
  draftContent.hidden = true;
  generationState.hidden = false;
  setWorkflow("Generating draft", "Reading approved source information", "active");
  markStep(0, true);

  const stages = [
    ["Reading approved case events…", "28%"],
    ["Reconstructing the incident timeline…", "52%"],
    ["Applying the incident report structure…", "76%"],
    ["Checking statements against source data…", "100%"]
  ];

  for (const [message, progress] of stages) {
    generationMessage.textContent = message;
    progressBar.style.width = progress;
    await new Promise((resolve) => window.setTimeout(resolve, 650));
  }

  generated = true;
  generationState.hidden = true;
  draftContent.hidden = false;
  reviewLocked.hidden = true;
  reviewContent.hidden = false;
  reviewState.textContent = "Review required";
  markStep(1, true);
  setWorkflow("Draft ready for review", "One information gap requires attention", "warning");
  generateButton.textContent = "Draft generated";
  showToast("Draft created. Every factual statement remains linked to its source.");
});

document.querySelectorAll(".citation").forEach((button) => {
  button.addEventListener("click", () => {
    showPanel("source-panel");
    document.querySelectorAll(".timeline-event").forEach((event) => {
      event.classList.remove("is-highlighted");
    });
    const sources = button.dataset.source.split(" ");
    sources.forEach((source) => {
      document.querySelector(`#${source}`)?.classList.add("is-highlighted");
    });
    document.querySelector(`#${sources[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast(`${sources.length} source ${sources.length === 1 ? "entry" : "entries"} highlighted.`);
  });
});

editButton.addEventListener("click", () => {
  editing = !editing;
  reportDocument.querySelectorAll("[contenteditable]").forEach((element) => {
    element.contentEditable = String(editing);
  });
  editButton.textContent = editing ? "Finish editing" : "Edit draft";
  showToast(editing ? "Editing enabled. Human changes remain part of the review." : "Edits saved in this demonstration.");
});

checks.forEach((check) => {
  check.addEventListener("change", () => {
    approveButton.disabled = !checks.every((item) => item.checked);
    if (!approveButton.disabled) {
      document.querySelector(".approval-help").textContent = "All required checks are complete.";
    }
  });
});

changesButton.addEventListener("click", () => {
  if (!reviewComment.value.trim()) {
    reviewComment.focus();
    showToast("Add a reviewer comment describing the required change.");
    return;
  }
  reviewState.textContent = "Changes requested";
  reviewState.style.color = "var(--red)";
  reviewState.style.background = "var(--red-soft)";
  setWorkflow("Changes requested", "Draft returned with reviewer comments", "warning");
  showToast("Changes requested. No report has been approved or published.");
});

approveButton.addEventListener("click", () => {
  reviewState.textContent = "Approved by incident manager";
  reviewState.style.color = "var(--green)";
  reviewState.style.background = "var(--green-soft)";
  setWorkflow("Report approved", "Human review completed · ready for established controls", "approved");
  markStep(2, true);
  approveButton.textContent = "Approved";
  approveButton.disabled = true;
  changesButton.disabled = true;
  checks.forEach((check) => {
    check.disabled = true;
  });
  showToast("Report approved. External publication would still follow established company controls.");
});

resetButton.addEventListener("click", () => {
  generated = false;
  editing = false;
  generateButton.disabled = false;
  generateButton.innerHTML = '<span class="button-icon" aria-hidden="true">✦</span> Generate report draft';
  draftEmpty.hidden = false;
  generationState.hidden = true;
  draftContent.hidden = true;
  reviewLocked.hidden = false;
  reviewContent.hidden = true;
  reviewState.textContent = "Waiting for draft";
  reviewState.removeAttribute("style");
  progressBar.style.width = "8%";
  reviewComment.value = "";
  approveButton.textContent = "Approve report";
  approveButton.disabled = true;
  changesButton.disabled = false;
  checks.forEach((check) => {
    check.checked = false;
    check.disabled = false;
  });
  reportDocument.querySelectorAll("[contenteditable]").forEach((element) => {
    element.contentEditable = "false";
  });
  editButton.textContent = "Edit draft";
  document.querySelectorAll(".timeline-event").forEach((event) => {
    event.classList.remove("is-highlighted");
  });
  steps.forEach((step) => step.classList.remove("is-complete"));
  setWorkflow("Ready to generate", "No report has been generated", "ready");
  showPanel("source-panel");
  showToast("Demonstration reset.");
});
