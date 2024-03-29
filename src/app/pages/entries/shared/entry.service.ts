import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

import { Observable, throwError } from "rxjs";
import { map, catchError, mergeMap } from "rxjs/operators";

import { Entry } from './entry.model';
import { CategoryService } from '../../categories/shared/category.service';

@Injectable({
  providedIn: 'root'
})
export class EntryService {

  private apiPath: string = "api/entries";

  constructor(
    private http: HttpClient,
    private categoryService: CategoryService
  ) { }


  getAll(): Observable<Entry[]> {
    return this.http.get(this.apiPath).pipe(
      catchError(this.handleError),
      map(this.jsonDataToEntries)
    );
  }

  getById(id: number): Observable<Entry> {
    const url = `${this.apiPath}/${id}`;

    return this.http.get(url).pipe(
      catchError(this.handleError),
      map(this.jsonDataToEntry)
    );
  }

  create(entry: Entry): Observable<Entry> {

    // esse return é devido ao imemory-web-api não conseguir fazer o relacionamento
    return this.categoryService.getById(entry.categoryId as number).pipe(
      mergeMap(category => {
        entry.category = category;

        return this.http.post(this.apiPath, entry).pipe(
          catchError(this.handleError),
          map(this.jsonDataToEntry)
        )
      })
    );
    /*
     * Quando o servidor tem o relacionamento das tabelas
     *
      return this.http.post(this.apiPath, entry).pipe(
        catchError(this.handleError),
        map(this.jsonDataToEntry)
      );
    */
  }

  

  update(entry: Entry): Observable<Entry> {
    const url = `${this.apiPath}/${entry.id}`;

    // mesmo caso do create
    return this.categoryService.getById(entry.categoryId as number).pipe(
      mergeMap(category => {
        entry.category = category;

        return this.http.put(url, entry).pipe(
          catchError(this.handleError),
          map(() => entry)
        )
      })
    );
  }

  delete(id: number): Observable<any> {
    const url = `${this.apiPath}/${id}`;

    return this.http.delete(url).pipe(
      catchError(this.handleError),
      map(() => null)
    );
  }

  // PRIVATE METHODS

  private jsonDataToEntries(jsonData: any[]): Entry[] {
    const entries: Entry[] = [];
    jsonData.forEach(element => {
      const entry = Object.assign(new Entry(), element);
      entries.push(entry);
    });
    
    return entries;
  }

  private jsonDataToEntry(jsonData: any): Entry {
    return jsonData as Entry;
  }

  private handleError(error: any): Observable<any>{
    console.log("ERRO NA REQUISIÇÃO => ", error);
    return throwError(() => new Error('ERRO NA REQUISIÇÃO' + error));
  }
}