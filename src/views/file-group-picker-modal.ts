import { App, Modal, Notice, TFile } from "obsidian";

interface FileGroupPickerModalOptions {
  title: string;
}

interface FileRow {
  file: TFile;
  checkbox: HTMLInputElement;
  row: HTMLElement;
}

export class FileGroupPickerModal extends Modal {
  private resolve!: (value: TFile[] | null) => void;
  private settled = false;
  private searchInput!: HTMLInputElement;
  private rows: FileRow[] = [];

  constructor(
    app: App,
    private readonly files: TFile[],
    private readonly options: FileGroupPickerModalOptions,
  ) {
    super(app);
  }

  openPicker(): Promise<TFile[] | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      text: "Choose one or more notes to use as context.",
    });

    this.searchInput = contentEl.createEl("input", {
      cls: "brain-modal-input",
      attr: {
        placeholder: "Filter notes...",
        type: "text",
      },
    });
    this.searchInput.addEventListener("input", () => {
      this.filterRows(this.searchInput.value);
    });

    const list = contentEl.createEl("div", {
      cls: "brain-file-group-list",
    });

    for (const file of this.files) {
      const row = list.createEl("label", {
        cls: "brain-file-group-row",
      });
      const checkbox = row.createEl("input", {
        type: "checkbox",
      }) as HTMLInputElement;
      row.createEl("span", {
        text: file.path,
      });
      this.rows.push({ file, checkbox, row });
    }

    const buttons = contentEl.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Use Selected",
    }).addEventListener("click", () => {
      const selected = this.rows
        .filter((row) => row.checkbox.checked)
        .map((row) => row.file);
      if (!selected.length) {
        new Notice("Select at least one note");
        return;
      }
      this.finish(selected);
    });

    buttons.createEl("button", {
      cls: "brain-button",
      text: "Cancel",
    }).addEventListener("click", () => {
      this.finish(null);
    });
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }

  private filterRows(value: string): void {
    const query = value.trim().toLowerCase();
    for (const row of this.rows) {
      const match = !query || row.file.path.toLowerCase().includes(query);
      row.row.style.display = match ? "" : "none";
    }
  }

  private finish(files: TFile[] | null): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolve(files);
    this.close();
  }
}
