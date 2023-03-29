import { Observable } from 'rxjs';
import { Component, OnInit, Inject } from '@angular/core';
import { NgForm } from '@angular/forms';

import {
  GridDataResult,
  CancelEvent,
  EditEvent,
  GridComponent,
  RemoveEvent,
  SaveEvent,
  AddEvent,
} from '@progress/kendo-angular-grid';
import { State, process } from '@progress/kendo-data-query';

import { Product } from './model';
import { map } from 'rxjs/operators';
import { EditService } from './edit.service';

@Component({
  selector: 'my-app',
  template: `
        <form novalidate #myForm="ngForm">
            <kendo-grid
                [data]="view | async"
                [pageSize]="gridState.take"
                [skip]="gridState.skip"
                [sort]="gridState.sort"
                [pageable]="true"
                (dataStateChange)="onStateChange($event)"
                (edit)="editHandler($event)"
                (cancel)="cancelHandler($event)"
                (save)="saveHandler($event)"
                (remove)="removeHandler($event)"
                (add)="addHandler($event, myForm)"
                [navigable]="true"
            >
                <ng-template kendoGridToolbarTemplate>
                    <button kendoGridAddCommand type="button">Add new</button>
                </ng-template>
                <kendo-grid-column field="ProductName" title="Product Name">
                    <ng-template kendoGridEditTemplate let-dataItem="dataItem">
                        <kendo-textbox [(ngModel)]="dataItem.ProductName" name="ProductName" required> </kendo-textbox>
                    </ng-template>
                </kendo-grid-column>
                <kendo-grid-column field="UnitPrice" editor="numeric" title="Price">
                    <ng-template kendoGridEditTemplate let-dataItem="dataItem">
                        <kendo-numerictextbox [(ngModel)]="dataItem.UnitPrice" name="UnitPrice"></kendo-numerictextbox>
                    </ng-template>
                </kendo-grid-column>
                <kendo-grid-column field="Discontinued" editor="boolean" title="Discontinued">
                    <ng-template kendoGridEditTemplate let-dataItem="dataItem">
                        <input [(ngModel)]="dataItem.Discontinued" name="Discontinued" kendoCheckBox type="checkbox" />
                    </ng-template>
                </kendo-grid-column>
                <kendo-grid-column field="UnitsInStock" editor="numeric" title="Units In Stock">
                    <ng-template kendoGridEditTemplate let-dataItem="dataItem">
                        <kendo-numerictextbox
                            [(ngModel)]="dataItem.UnitsInStock"
                            name="UnitsInStock"
                            required
                            [min]="0"
                            [max]="99"
                        ></kendo-numerictextbox>
                    </ng-template>
                </kendo-grid-column>
                <kendo-grid-command-column title="command" [width]="220">
                    <ng-template kendoGridCellTemplate let-isNew="isNew">
                        <button kendoGridEditCommand type="button" [primary]="true">Edit</button>
                        <button kendoGridRemoveCommand type="button">Remove</button>
                        <button kendoGridSaveCommand type="button" [disabled]="myForm.invalid || myForm.pristine">
                            {{ isNew ? 'Add' : 'Update' }}
                        </button>
                        <button kendoGridCancelCommand type="button">{{ isNew ? 'Discard changes' : 'Cancel' }}</button>
                    </ng-template>
                </kendo-grid-command-column>
            </kendo-grid>
        </form>
    `,
})
export class AppComponent implements OnInit {
  public view: Observable<GridDataResult>;
  public gridState: State = {
    sort: [],
    skip: 0,
    take: 5,
  };

  private editService: EditService;
  private editedRowIndex: number;
  private editedProduct: Product;

  constructor(@Inject(EditService) editServiceFactory: () => EditService) {
    this.editService = editServiceFactory();
  }

  public ngOnInit(): void {
    this.view = this.editService.pipe(
      map((data) => process(data, this.gridState))
    );

    this.editService.read();
  }

  public onStateChange(state: State): void {
    this.gridState = state;

    this.editService.read();
  }

  public addHandler(args: AddEvent, formInstance: NgForm): void {
    formInstance.reset();
    // close the previously edited item
    this.closeEditor(args.sender);
    // open a new item editor
    args.sender.addRow(new Product());
  }

  public editHandler(args: EditEvent): void {
    // close the previously edited item
    this.closeEditor(args.sender);
    // track the most recently edited row
    // it will be used in `closeEditor` for closing the previously edited row
    this.editedRowIndex = args.rowIndex;
    // clone the current - `[(ngModel)]` will modify the original item
    // use this copy to revert changes
    this.editedProduct = Object.assign({}, args.dataItem);
    // edit the row
    args.sender.editRow(args.rowIndex);
  }

  public cancelHandler(args: CancelEvent): void {
    // call the helper method
    this.closeEditor(args.sender, args.rowIndex);
  }

  public saveHandler(args: SaveEvent): void {
    // update the data source
    this.editService.save(args.dataItem, args.isNew);

    // close the editor, that is, revert the row back into view mode
    args.sender.closeRow(args.rowIndex);

    this.editedRowIndex = undefined;
    this.editedProduct = undefined;
  }

  public removeHandler(args: RemoveEvent): void {
    // remove the current dataItem from the current data source
    // in this example, the dataItem is `editService`
    this.editService.remove(args.dataItem);
  }

  private closeEditor(
    grid: GridComponent,
    rowIndex = this.editedRowIndex
  ): void {
    // close the editor
    grid.closeRow(rowIndex);
    // revert the data item to original state
    this.editService.resetItem(this.editedProduct);
    // reset the helpers
    this.editedRowIndex = undefined;
    this.editedProduct = undefined;
  }
}
