import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Note } from '../note.model';
import { NoteService } from '../note.service';
import { ReminderCopy } from '../../reminder/reminder.model';
import { ReminderService } from '../../reminder/reminder.service';
import { SnackService } from '../../../core/snack/snack.service';

@Component({
  selector: 'dialog-add-note-reminder',
  templateUrl: './dialog-add-note-reminder.component.html',
  styleUrls: ['./dialog-add-note-reminder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAddNoteReminderComponent {
  public date: string;
  public title: string;
  public isEdit: boolean;
  public reminder: ReminderCopy;
  public note: Note;

  constructor(
    private _noteService: NoteService,
    private _snackService: SnackService,
    private _reminderService: ReminderService,
    private _matDialogRef: MatDialogRef<DialogAddNoteReminderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { note: Note },
  ) {
    this.note = this.data.note;
    this.reminder = this.note.reminderId && {
      ...this._reminderService.getById(this.data.note.reminderId)
    };
    this.isEdit = !!(this.reminder && this.reminder.id);
    if (this.isEdit) {
      this.date = this._convertDate(new Date(this.reminder.remindAt));
      this.title = this.reminder.title;
    } else {
      this.title = this.note.content.substr(0, 40);
    }
  }

  save() {
    const timestamp = this.date && new Date(this.date).getTime();

    if (!timestamp || !this.title) {
      return;
    }

    if (this.isEdit) {
      this._noteService.updateReminder(
        this.note.id,
        this.reminder.id,
        timestamp,
        this.title,
      );
      this.close();
    } else {
      this._noteService.addReminder(
        this.note.id,
        timestamp,
        this.title,
      );
      this.close();
    }
  }

  remove() {
    this._noteService.removeReminder(this.note.id, this.reminder.id);
    this.close();
  }

  close() {
    this._matDialogRef.close();
  }

  // TODO check why we're off by one hour
  private _convertDate(date: Date): string {
    const isoStr = date.toISOString();
    return isoStr.substring(0, isoStr.length - 1);
  }
}
