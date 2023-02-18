import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { switchMap } from 'rxjs';

import { Category } from '../../categories/shared/category.model';
import { Entry } from '../shared/entry.model';
import { CategoryService } from '../../categories/shared/category.service';
import { EntryService } from '../shared/entry.service';

import * as toastr from "toastr";  

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.css']
})
export class EntryFormComponent implements OnInit, AfterContentChecked {

  submittingForm: boolean = false;

  currentAction: string = "";
  pageTitle: string = "";
  
  entry: Entry = new Entry();
  categories: Array<Category> = [];
  serverErrorMessages: string[] = [];

  entryForm: UntypedFormGroup = new UntypedFormGroup({});

  constructor(
    protected entryService: EntryService,
    protected categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: UntypedFormBuilder
  ){ }

  ngOnInit() {
    this.setCurrentAction();
    this.loadCategories();
    this.buildEntryForm();
    this.loadEntry();
  }

  ngAfterContentChecked(): void {
    this.setPageTitle();
  }

  submitForm(){
    this.submittingForm = true;

    if (this.getCurrentActionEqualsNew()) 
      this.createEntry();
    else 
      this.updateEntry();
  }

  protected buildEntryForm() {
    this.entryForm = this.formBuilder.group({
      id: [null],
      name: [null, [Validators.required, Validators.minLength(2)]],
      description: [null, [Validators.required, Validators.minLength(2)]],
      type: ['expense', [Validators.required]],
      amount: [null, [Validators.required]],
      date: [null, [Validators.required]],
      paid: [true, [Validators.required]],
      categoryId: [null, [Validators.required]]
    });
  }

  get typeOptions(): Array<any> {
    return Object.entries(Entry.types).map(
      ([value, text]) => {
        return {
          text: text,
          value: value
        }
      }
    )
  }

  // private methods
  
  private setCurrentAction(){
    this.currentAction = (this.route.snapshot.url[0].path == "new") ? "new" : "edit";
  }

  private setPageTitle(){
    if(this.getCurrentActionEqualsNew())
      this.pageTitle = "Cadastro de um novo Lançamento"
    else {
      const entryName = this.entry.name || "";
      this.pageTitle = "Editando Lançamento: " + entryName;
    }
  }

  private createEntry(){
    const entry: Entry = Object.assign(new Entry(), this.entryForm.value);
    this.entryService.create(entry)
    .subscribe({
      next: entry => this.actionsForSuccess(entry),
      error: error => this.actionsForError(error)
    });
  }

  private updateEntry(){
    const entry: Entry = Object.assign(new Entry(), this.entryForm.value);
    this.entryService.update(entry)
    .subscribe({
      next: entry => this.actionsForSuccess(entry),
      error: error => this.actionsForError(error)
    });
  }

  private loadEntry(){
    if (!this.getCurrentActionEqualsNew()) {

      let id = this.route.snapshot.params["id"];

      this.route.paramMap.pipe(
        switchMap(params => this.entryService.getById(+id))
      ).subscribe({
        next: (entry) => {
          this.entry = entry;
          this.entryForm.patchValue(entry);
        },
        error: () => alert("Ocorreu um erro no servidor, tente mais tarde")
      });
    }
  }

  private actionsForSuccess(entry: Entry){

    toastr.success("Solicitação processada com Sucesso!");

    // redirect / reload component
    this.router.navigateByUrl("entries", {skipLocationChange: true}).then( //não armazena a navegação no histórico
      () => this.router.navigate(["entries", entry.id, "edit"])
    ); 
  }

  private actionsForError(error: any){
    toastr.error("Ocorreu um erro ao processar a sua solicitação!");

    this.submittingForm = false;

    if (error.status === 422)
      this.serverErrorMessages = JSON.parse(error._body).errors;
    else
      this.serverErrorMessages = ["Falha na comunicação com o servidor. por favor, tente mais tarde."];

  }

  private loadCategories() {
    this.categoryService.getAll().subscribe(
      categories => this.categories = categories
    );
  }

  private getCurrentActionEqualsNew() {
    if (this.currentAction === "new")
      return true;
    else 
      return false;
  }
  
}
