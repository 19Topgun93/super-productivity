import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { BookmarkState, initialBookmarkState, selectAllBookmarks, selectIsShowBookmarkBar } from './store/bookmark.reducer';
import {
  AddBookmark,
  DeleteBookmark,
  HideBookmarks,
  LoadBookmarkState,
  ShowBookmarks,
  ToggleBookmarks,
  UpdateBookmark
} from './store/bookmark.actions';
import { Observable } from 'rxjs';
import { Bookmark } from './bookmark.model';
import shortid from 'shortid';
import { DialogEditBookmarkComponent } from './dialog-edit-bookmark/dialog-edit-bookmark.component';
import { MatDialog } from '@angular/material';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { createFromDrop, createFromPaste, DropPasteInput } from '../../core/drop-paste-input/drop-paste-input';

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {
  bookmarks$: Observable<Bookmark[]> = this._store$.pipe(select(selectAllBookmarks));
  isShowBookmarks$: Observable<boolean> = this._store$.pipe(select(selectIsShowBookmarkBar));

  constructor(
    private _store$: Store<BookmarkState>,
    private _matDialog: MatDialog,
    private _persistenceService: PersistenceService,
  ) {
  }

  async loadStateForProject(projectId: string) {
    const lsBookmarkState = await this._persistenceService.loadBookmarksForProject(projectId);
    this.loadState(lsBookmarkState || initialBookmarkState);
  }

  loadState(state: BookmarkState) {
    this._store$.dispatch(new LoadBookmarkState({state}));
  }

  addBookmark(bookmark: Bookmark) {
    this._store$.dispatch(new AddBookmark({
      bookmark: {
        ...bookmark,
        id: shortid()
      }
    }));
  }

  deleteBookmark(id: string) {
    this._store$.dispatch(new DeleteBookmark({id}));
  }

  updateBookmark(id: string, changes: Partial<Bookmark>) {
    this._store$.dispatch(new UpdateBookmark({bookmark: {id, changes}}));
  }

  showBookmarks() {
    this._store$.dispatch(new ShowBookmarks());
  }

  hideBookmarks() {
    this._store$.dispatch(new HideBookmarks());
  }

  toggleBookmarks() {
    this._store$.dispatch(new ToggleBookmarks());
  }


  // HANDLE INPUT
  // ------------
  createFromDrop(ev) {
    this._handleInput(createFromDrop(ev), ev);
  }


  createFromPaste(ev) {
    this._handleInput(createFromPaste(ev), ev);
  }


  private _handleInput(bookmark: DropPasteInput, ev) {
    // properly not intentional so we leave
    if (!bookmark || !bookmark.path) {
      return;
    }

    // don't intervene with text inputs
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') {
      return;
    }

    ev.preventDefault();
    ev.stopPropagation();

    this._matDialog.open(DialogEditBookmarkComponent, {
      restoreFocus: true,
      data: {
        bookmark: {...bookmark},
      },
    }).afterClosed()
      .subscribe((bookmark_) => {
        if (bookmark_) {
          if (bookmark_.id) {
            this.updateBookmark(bookmark_.id, bookmark_);
          } else {
            this.addBookmark(bookmark_);
          }
        }
      });

  }
}
