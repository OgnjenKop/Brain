import { App, Modal, Notice } from "obsidian";
import type { BrainPluginSettings } from "../settings/settings";
import type { VaultWriteOperation, VaultWritePlan } from "../services/vault-write-service";
import { isSafeMarkdownPath } from "../utils/path-safety";
import { showError } from "../utils/error-handler";

interface VaultPlanModalOptions {
  plan: VaultWritePlan;
  settings: BrainPluginSettings;
  onApprove: (plan: VaultWritePlan) => Promise<string[]>;
  onComplete: (message: string, paths: string[]) => Promise<void> | void;
}

export class VaultPlanModal extends Modal {
  private working = false;
  private readonly selectedOperations = new Set<number>();
  private readonly draftOperations: VaultWriteOperation[];
  private approveButtonEl!: HTMLButtonElement;
  private cancelButtonEl!: HTMLButtonElement;

  constructor(
    app: App,
    private readonly options: VaultPlanModalOptions,
  ) {
    super(app);
    this.draftOperations = options.plan.operations.map((operation) => ({ ...operation }));
    this.draftOperations.forEach((_, index) => this.selectedOperations.add(index));
  }

  onOpen(): void {
    this.render();
  }

  close(): void {
    if (this.working) {
      return;
    }
    super.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.addClass("brain-modal");
    this.contentEl.createEl("h2", { text: "Review Vault Changes" });
    this.contentEl.createEl("p", {
      text: `${this.options.plan.summary || "Brain proposed vault changes."} Confidence: ${this.options.plan.confidence}.`,
    });

    for (const [index, operation] of this.draftOperations.entries()) {
      this.renderOperation(index, operation);
    }

    if (this.options.plan.questions.length) {
      const questions = this.contentEl.createEl("div", { cls: "brain-plan-questions" });
      questions.createEl("h3", { text: "Open Questions" });
      const list = questions.createEl("ul");
      for (const question of this.options.plan.questions) {
        list.createEl("li", { text: question });
      }
    }

    const buttons = this.contentEl.createEl("div", { cls: "brain-button-row" });
    this.approveButtonEl = buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Approve and Write",
    });
    this.approveButtonEl.addEventListener("click", () => {
      void this.approve();
    });
    this.cancelButtonEl = buttons.createEl("button", {
      cls: "brain-button",
      text: "Cancel",
    });
    this.cancelButtonEl.addEventListener("click", () => {
      this.close();
    });
  }

  private async approve(): Promise<void> {
    if (this.working) {
      return;
    }
    const operations = this.draftOperations
      .filter((_, index) => this.selectedOperations.has(index))
      .map((operation) => ({
        ...operation,
        path: operation.path.trim(),
        content: operation.content.trim(),
      }))
      .filter((operation) => operation.path && operation.content);
    if (!operations.length) {
      new Notice("Select at least one change to apply");
      return;
    }
    const invalidPath = operations.find((operation) => !isSafeMarkdownPath(operation.path, this.options.settings));
    if (invalidPath) {
      new Notice(`Invalid target path: ${invalidPath.path}`);
      return;
    }
    this.working = true;
    this.setButtonsEnabled(false);
    try {
      const paths = await this.options.onApprove({
        ...this.options.plan,
        operations,
      });
      const message = paths.length
        ? `Updated ${paths.join(", ")}`
        : "No vault changes were applied";
      new Notice(message);
      await this.options.onComplete(message, paths);
      this.working = false;
      this.close();
    } catch (error) {
      showError(error, "Could not apply vault changes");
      this.setButtonsEnabled(true);
    } finally {
      this.working = false;
    }
  }

  private setButtonsEnabled(enabled: boolean): void {
    if (this.approveButtonEl) {
      this.approveButtonEl.disabled = !enabled;
      this.approveButtonEl.textContent = enabled ? "Approve and Write" : "Writing...";
    }
    if (this.cancelButtonEl) {
      this.cancelButtonEl.disabled = !enabled;
    }
  }

  private renderOperation(index: number, operation: VaultWriteOperation): void {
    const item = this.contentEl.createEl("div", { cls: "brain-plan-operation" });
    const header = item.createEl("label", { cls: "brain-plan-operation-header" });
    const checkbox = header.createEl("input", {
      attr: { type: "checkbox" },
    }) as HTMLInputElement;
    checkbox.checked = this.selectedOperations.has(index);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        this.selectedOperations.add(index);
      } else {
        this.selectedOperations.delete(index);
      }
    });
    header.createEl("span", { text: describeOperation(operation) });

    if (operation.description) {
      item.createEl("div", {
        cls: "brain-plan-description",
        text: operation.description,
      });
    }

    const pathInput = item.createEl("input", {
      cls: "brain-modal-input brain-plan-path-input",
      attr: {
        type: "text",
        "aria-label": "Target markdown path",
      },
    }) as HTMLInputElement;
    pathInput.value = operation.path;
    pathInput.addEventListener("input", () => {
      this.draftOperations[index] = {
        ...this.draftOperations[index],
        path: pathInput.value,
      } as VaultWriteOperation;
    });

    const textarea = item.createEl("textarea", {
      cls: "brain-modal-input brain-plan-editor",
      attr: { rows: "10" },
    });
    textarea.value = operation.content;
    textarea.addEventListener("input", () => {
      this.draftOperations[index] = {
        ...this.draftOperations[index],
        content: textarea.value,
      };
    });
  }
}

function describeOperation(operation: VaultWritePlan["operations"][number]): string {
  if (operation.type === "append") {
    return `Append to ${operation.path}`;
  }
  return `Create ${operation.path}`;
}
