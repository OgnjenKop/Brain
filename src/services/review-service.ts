import { buildNoteTitle } from "../utils/text";
import { InboxEntry, InboxEntryIdentity, InboxService } from "./inbox-service";
import { JournalService } from "./journal-service";
import { TaskService } from "./task-service";
import { ReviewLogEntry, ReviewLogService } from "./review-log-service";
import { BrainPluginSettings } from "../settings/settings";
import { NoteService } from "./note-service";

export class ReviewService {
  constructor(
    private readonly noteService: NoteService,
    private readonly inboxService: InboxService,
    private readonly taskService: TaskService,
    private readonly journalService: JournalService,
    private readonly reviewLogService: ReviewLogService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async getRecentInboxEntries(limit = 20): Promise<InboxEntry[]> {
    return this.inboxService.getRecentEntries(limit);
  }

  async promoteToTask(entry: InboxEntry): Promise<string> {
    const text = entry.body || entry.preview || entry.heading;
    const saved = await this.taskService.appendTask(text);
    await this.appendReviewLogBestEffort(entry, "task");
    const markerUpdated = await this.markInboxReviewed(entry, "task");
    return this.appendMarkerNote(
      `Promoted inbox entry to task in ${saved.path}`,
      markerUpdated,
    );
  }

  async keepEntry(entry: InboxEntry): Promise<string> {
    return `Left inbox entry in ${this.settingsProvider().inboxFile}`;
  }

  async skipEntry(entry: InboxEntry): Promise<string> {
    await this.appendReviewLogBestEffort(entry, "skip");
    const markerUpdated = await this.markInboxReviewed(entry, "skip");
    return this.appendMarkerNote("Skipped inbox entry", markerUpdated);
  }

  async appendToJournal(entry: InboxEntry): Promise<string> {
    const saved = await this.journalService.appendEntry(
      [
        `Source: ${entry.heading}`,
        "",
        entry.body || entry.preview || entry.heading,
      ].join("\n"),
    );
    await this.appendReviewLogBestEffort(entry, "journal");
    const markerUpdated = await this.markInboxReviewed(entry, "journal");
    return this.appendMarkerNote(`Appended inbox entry to ${saved.path}`, markerUpdated);
  }

  async promoteToNote(entry: InboxEntry): Promise<string> {
    const title = buildNoteTitle(entry);
    const body = [
      "Original capture:",
      entry.body || entry.preview || entry.heading,
    ].join("\n");
    const saved = await this.noteService.createGeneratedNote(
      title,
      body,
      "Brain inbox",
      null,
    );
    await this.appendReviewLogBestEffort(entry, "note");
    const markerUpdated = await this.markInboxReviewed(entry, "note");
    return this.appendMarkerNote(
      `Promoted inbox entry to note in ${saved.path}`,
      markerUpdated,
    );
  }

  async reopenFromReviewLog(entry: ReviewLogEntry): Promise<string> {
    const identity = {
      heading: entry.heading,
      body: "",
      preview: entry.preview,
      signature: entry.signature,
      signatureIndex: entry.signatureIndex,
    };
    const reopened = await this.inboxService.reopenEntry(identity);
    if (!reopened) {
      throw new Error(`Could not re-open inbox entry ${entry.heading}`);
    }
    await this.appendReviewLogBestEffort(identity, "reopen");
    return `Re-opened inbox entry ${entry.heading}`;
  }

  private async markInboxReviewed(entry: InboxEntry, action: string): Promise<boolean> {
    try {
      return await this.inboxService.markEntryReviewed(entry, action);
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  private appendMarkerNote(message: string, markerUpdated: boolean): string {
    return markerUpdated ? message : `${message} (review marker not updated)`;
  }

  private async appendReviewLogBestEffort(
    entry: InboxEntryIdentity,
    action: string,
  ): Promise<void> {
    try {
      await this.reviewLogService.appendReviewLog(entry, action);
    } catch (error) {
      console.error(error);
    }
  }
}

