import { Component } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';

import { SmartTableData } from '../../../@core/data/smart-table';

@Component({
  selector: 'ngx-smart-table',
  templateUrl: './smart-table.component.html',
  styleUrls: ['./smart-table.component.scss'],
})
export class SmartTableComponent {

  settings = {
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      id: {
        title: 'ID',
        type: 'number',
      },
      orderkey: {
        title: 'Key',
        type: 'String',
      },
      prodwarehouse: {
        title: 'Prod Warehouse',
        type: 'string',
      },
      shipmentmode: {
        title: 'Shipment Mode',
        type: 'string',
      },
      destination: {
        title: 'Destination',
        type: 'string',
      },
      reqdeldate: {
        title: 'Req Del Date',
        type: 'date',
      },
      plandeldate: {
        title: 'Plan Date',
        type: 'date',
      },
        coqty: {
        title: 'CO QTY',
        type: 'number',
      },
        fobprice: {
        title: 'FOB Price',
        type: 'number',
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(private service: SmartTableData) {
    const data = this.service.getData();
    this.source.load(data);
  }

  onDeleteConfirm(event): void {
    if (window.confirm('Are you sure you want to delete?')) {
      event.confirm.resolve();
    } else {
      event.confirm.reject();
    }
  }
}
