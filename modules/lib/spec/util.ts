import { TestBed } from '@angular/core/testing';
import { select, Store } from '@ngrx/store';
import { first, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

/* Util */
export function firstValueFrom<T>(obs$: Observable<T>): Promise<T> {
  return obs$.pipe(first()).toPromise();
}

export function testStoreValue(expected: any, done: () => void): void {
  const store = TestBed.inject(Store);
  store
    .pipe(
      select((state) => state.feature),
      take(1)
    )
    .subscribe({
      next: (val) => {
        expect(val).toEqual(expected);
      },
      error: done,
      complete: done
    });
}

export async function testStoreValueAsync<T>(expected: any, selector?: (state: any) => any): Promise<void> {
  const store = TestBed.inject(Store);
  const value = await firstValueFrom(store.pipe(select((state) => state.feature))).then(null, (err) =>
    console.error(err)
  );
  expect(selector ? selector(value) : value).toEqual(expected);
}
