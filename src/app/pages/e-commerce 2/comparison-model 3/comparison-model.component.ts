import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
//import * as fs from 'fs';
import { DbconService } from "../../../services/dbcon.service";


interface DataSet {
  compositeKey: string;
  prodWarehouse: string;
  shipmentMode: string;
  reqDeldate: string;
  planDelDate: string;
  COQty: string;
  factoryVendor: string;
  modeOfShip: string;
  originalMastOwnershipDate: string;
  planMASTOwnershipDate: string;
  orderQuantity: string;
}

const FILTER_PAG_REGEX = /[^0-9]/g;

//export declare type NbComponentSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant';

@Component({
  selector: 'ngx-comparison-model3',
  templateUrl: './comparison-model.component.html',
  styleUrls: ['./comparison-model.component.scss']
})
export class ComparisonModelComponent3 {

  @ViewChild('content', { static: true }) content: TemplateRef<any>;

  data: DataSet[];
  closeResult = '';
  page = 1;
  pageSize = 20;
  collectionSize;

  fileName = "M3_Shipment_Plan_&_Buy_Sheet_Comparison"

  constructor(private DbconService: DbconService, public modalService: NgbModal) { }

  open() {
    this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openModel(data) {
    console.log("Model 1 Opened ..........")
    this.data = data;
    this.collectionSize = this.data.length;
    this.modalService.open(this.content, { size: 'xl', scrollable: true });
  }

  refresh() {
    this.data
      .map((data, i) => ({ id: i + 1, ...data }))
      .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
  }

  selectPage(page: string) {
    this.page = parseInt(page, 10) || 1;
  }

  formatInput(input: HTMLInputElement) {
    input.value = input.value.replace(FILTER_PAG_REGEX, '');
  }

  async downloadExcel()
  {

    const BffPVHSSArray = await this.DbconService.getAllArray(
      "aas"
    );
    const OORMatchedOBRows = [];
    for (const row of BffPVHSSArray) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "m3sp",
        "M3SPKey",
        row.AASKey1
        );
        // console.log("OBMatchedRow" + OBMatchedRow);
        // console.log(row);
        // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, CustomerStyle, Destination, Color, PForLF, FOBPricePerPiece, Size, ForRF;
      if (OBMatchedRow) {
        compositeKey = row.AASKey1,
        CustomerStyle = OBMatchedRow.CustomerStyleNumber,
        Color = OBMatchedRow.Color,
        Destination = OBMatchedRow.Destination,
        PForLF = OBMatchedRow.ProdFac_LeadFactory,
        FOBPricePerPiece = OBMatchedRow.FOBPricePerPiece,
        Size = OBMatchedRow.Size,
        ForRF = this.mapAvailability(row.RevisedFactory, row.Factory)
      }else{
        compositeKey = row.AASKey1,
        CustomerStyle = "",
        Color = "",
        Destination = "",
        FOBPricePerPiece = "",
        Size = ""
      }
      OORMatchedOBRows.push({
        compositeKey: compositeKey,
        
        GlobalStyle: row.GlobalStyle,
        ColorCode: row.Color,
        DestinationComp: row.Destination,
        SizeComp: this.formatToString(this.mapSizeandSize(row.Size)).trim(),
        ForRF: this.mapAvailability(row.RevisedFactory, row.Factory),
        NRF: row.NRF,
        FOBorRFOB: this.mapAvailability(row.RevisedFOB, row.FOBPrice),
        Column: "",
        CustomerStyle: CustomerStyle,
        Color: Color,
        Destination: Destination,
        SizeM3: this.formatToString(Size).trim(),
        PForLF: PForLF,
        NRFComp: Color.split("-")[2],
        FOBPPP: FOBPricePerPiece,
      });
    }

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");

    let title =["","AA Sheet Table","","","","","","","","M3 Shipment Plan Table" ]
    let titleRow = worksheet.addRow(title);
    let header=[
      "Key(Season-ColorName-CustomStyleNo-VOPNo-COQty)",
      "Global Style",
      "Color Code",
      "Destination",
      "Size",
      "Factory / Revised Factory",
      "NRF",
      "FOB Price / Revised FOB",
      "",
      "Customer Style",
      "Color",
      "Destination",
      "Size",
      "Prod Factory / Lead Factory",
      "NRF",
      "FOB Price Per Piece"
    ]
    let headerRow = worksheet.addRow(header);

    for (let x1 of OORMatchedOBRows){
      let x2 = Object.keys(x1);

      let temp = []
      for(let y of x2)
      {
        temp.push(x1[y])
      }
      worksheet.addRow(temp)
    }

    for (let i = 0; i < OORMatchedOBRows.length; i =i + 1){
      //prodware house
      if(JSON.stringify(OORMatchedOBRows[i].SizeM3) !== JSON.stringify(OORMatchedOBRows[i].SizeComp)){
        worksheet.getCell("E"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("M"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //mode
      if(JSON.stringify(OORMatchedOBRows[i].ForRF) !== JSON.stringify(this.mapFactoryandMemberNameM3(OORMatchedOBRows[i].PForLF))){
        worksheet.getCell("F"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("N"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //req date
      if(JSON.stringify(OORMatchedOBRows[i].NRF) !== JSON.stringify(this.formatToString(OORMatchedOBRows[i].NRFComp).trim())){
        worksheet.getCell("G"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("O"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //plan date
      if(JSON.stringify(OORMatchedOBRows[i].FOBorRFOB) !== JSON.stringify(OORMatchedOBRows[i].FOBPPP)){
        worksheet.getCell("H"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("P"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }
    }

    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, this.fileName+'.xlsx');
    });
  }

  // Util functions
  readExcelFile(file, headers): Promise<any> {
    return new Promise<any>((resolve) => {
      let workBook = null;
      let sheetToJsonData = null;
      const reader = new FileReader();

      reader.onload = () => {
        const data = reader.result;
        workBook = XLSX.read(data, { type: "binary", cellDates: false });
        sheetToJsonData = workBook.SheetNames.reduce((initial, name) => {
          const sheet = workBook.Sheets[name];
          initial.sheet = XLSX.utils.sheet_to_json(sheet, {
            header: headers,
            range: 1,
          });
          return initial;
        }, {});
        resolve(sheetToJsonData.sheet);
      };
      reader.readAsBinaryString(file);
    });
  }

  groupArray(list, key) {
    return list.reduce((a, item) => {
      (a[item[key]] = a[item[key]] || []).push(item);
      return a;
    }, {});
  }

  formatBytes(bytes, decimals = 2) { 
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  formatToString(val){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString()
      return val
    }
  }

  formatCharAt(val, position){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString().charAt(position)
      return val
    }
  }

  formatSubString(val, position){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString().substring(0, position)
      return val
    }
  }

  formatSubStringRyt(val, position){
    if((val == null)){
      val = "";
      return val;
    }else{
      val = val.toString().substr(val.toString().length - position)
      return val;
    }
  }
  
  formatDatesOB(date){
    var day = this.formatSubStringRyt(date, 2) ;
    var month = `${this.formatCharAt(date,4)}${this.formatCharAt(date,5)}`;
    var year = this.formatSubString(date,4);

    const convertedDate =  year + '-' + month + '-' + day ;

    return convertedDate;
  }

  formatExcelDateToDateObj(serial){ 
    if (!!serial){
      const utc_days  = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const fractional_day = serial - Math.floor(serial) + 0.0000001;
      let total_seconds = Math.floor(86400 * fractional_day);
      const seconds = total_seconds % 60;
      total_seconds -= seconds;
      const hours = Math.floor(total_seconds / (60 * 60));
      const minutes = Math.floor(total_seconds / 60) % 60;

      let convertedDate = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
      let cd = this.formatDate(convertedDate);
      return cd;
    } else {
      return null;
    }
  }

  formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    return [year, month, day].join('-');
  }

  formatOBDateForOOROTROLR(date){
    if(date){
      var day = this.formatSubStringRyt(date, 2) ;
      var month = `${this.formatCharAt(date,4)}${this.formatCharAt(date,5)}`;
      var year = this.formatSubString(date,4);
  
      const convertedDate =  year + '-' + month + '-' + day ;
      var d = new Date(convertedDate);
  
      // add a day
      d.setDate(d.getDate() + 1);
      const  cd = this.formatDate(d)
  
      return cd;
    }else{
      return null
    }
  }

  // AAS and PVHSS mapping - Starts ------------------------------------------------------------------------------------------------

  setToMonday( date ) {
    var day = date.getDay() || 7;  
    if( day !== 1 ) 
        date.setHours(-24 * (day - 1)); 
    return date;
}

// setToMonday(new Date());

addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() - days);
  return this.convert(result);
}

convert(str) {
  var date = new Date(str),
    mnth = ("0" + (date.getMonth() + 1)).slice(-2),
    day = ("0" + date.getDate()).slice(-2);
  return [date.getFullYear(), mnth, day].join("-");
}

mapAvailability(value1, value2){
  if(value1){
    return value1;
  }else{
    return value2;
  }
}

mapAPLOBColorCodeNRF(Destination, PO, ColorName){
  if(Destination == 'NETHGA' || Destination == 'KOR' || Destination == 'JP04' || Destination == 'JPRTL'
  || Destination == 'PRC' || Destination == 'AHK' || Destination == 'IND02' || Destination == 'NETHOU' 
  || Destination == 'IND03' || Destination == 'JP01' || Destination == 'NETH' || Destination == 'TW01'
  || Destination == 'KRI01' || Destination == 'PAN01' || Destination == 'PRC01' || Destination == 'JP05' 
  || Destination == 'IND01' || Destination == 'CHN01' || Destination == 'TWN01' ){
    return ColorName.split("-").reverse()[1]; 
  }
  if(Destination == 'PA02' || Destination == 'CAN001' || Destination == 'MEX001' || Destination == 'USA002'
  || Destination == 'USA001' || Destination == 'MEX01' || Destination == 'AUS' || Destination == 'BRZ1' 
  || Destination == 'USA02' || Destination == 'BRAZIL' || Destination == 'CAN02' || Destination == 'MEXICO'){
    return ColorName.split("-").reverse()[0];
  }
  if(this.formatSubString(PO,4) == '4300'){
    return ColorName.split("-").reverse()[0];
  }
}

mapPVHSSColorCodeNRF(Country, PO, ColorCode, NRF){
  if(Country == 'INDIA' || Country == 'NETHERLANDS' || Country == 'CHINA' || Country == 'KOREA'
  || Country == 'HONG KONG' || Country == 'JAPAN'){
    return ColorCode; 
  }
  if(Country == 'AUSTRALIA' || Country == 'CANADA' || Country == 'UNITED STATES' || Country == 'PANAMA'
  || Country == 'MAXICO' || Country == 'BRAZIL'){
    return NRF;
  }
  if(this.formatSubString(PO,4) == '4300'){
    return ColorCode;
  }
}


mapFactoryandMemberName(value){
  switch(value){
    case "BFF":
      return "Brandix Apparel Solutions Limited - Avissawella";
    case "10680":
      return "Brandix Apparel Solutions Limited - Avissawella";
    // remove test
    case "Test":
      return "Test";
    default:
      return value;
  }
}

mapM3FactoryandProdFactory(value){
  switch(value){
    case "N09":
      return "BFF";
    case "N27":
      return "BFF";
    default:
      return value;
  }
}

mapSeasonPVH(value){
  switch(value){
    case "Fall":
      return "FA23";
    case "Spring":
      return "SP23";
    case "Basic":
      return "SP23";
    default:
      return value;
  }
}

//need to complete
mapFabricContentandGarmentFabrication(value){
  switch(value){
    case "POLY75NY25":
      return "PES 75 % PA 25%";
    case "MDL97EL3":
      return "97% MICRO MODAL 3% SPANDEX";
    case "CT96SP4":
      return "96% COTTON 4% ELASTANE";
    case "ORG100CTTN":
      return "100% COTTON";
    case "67BM28CT5E":
      return "67% BAMBOO 28% COTTON 5% ELASTANE";
    case "CT100":
      return "100% COTTON";
    case "CT98EL2":
      return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
    case "CT95SP5":
      return "95% COTTON 5% SPANDEX";
    case "96CMCON4EL":
      return "96% MICRO MODAL 4% ELASTANE";
    case "MDL97EL3":
      return "97% MICRO MODAL 3% SPANDEX";
    case "100Polyest":
      return "100% POLYESTER";
    case "PE100":
      return "100% POLYESTER";
    case "49C36AC15V":
      return "49% COTTON 36% ACRYLIC 15% VISCOSE";
    case "55Ct+37+8%":
      return "CO 55 % CMD 37 % EL 8 %";
    case "100":
      return "100% COTTON";
    case "95Ctn5Elst":
      return "95% COTTON 5% ELASTANE";
    case "70CT30PEST":
      return "CKNA related one";
    case "100Supima":
      return "CKNA related one";
    case "CT57PO38S5":
      return "57% COTTON, 38% POLYESTER, 5% SPANDEX";
    case "CT95EL5":
      return "95% COTTON 5% ELASTANE";
    case "CT60PLY40":
      return "60% COTTON 40% POLYESTER";
    case "CT60EST40":
      return "60% COTTON 40% POLYESTER";
    case "60BC40PET":
      return "60% COTTON 40% POLYESTER";
    case "96MODAL4S":
      return "96% MICRO MODAL 4% ELASTANE";
    case "58CT39RECY":
      return "CO 58 % RPE 39 % EL 3 %";
    case "57CT38PEST":
      return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
    case "78CT22SE":
      return "78% NYLON 22% ELASTANE";
    case "74BCICTN21":
      return "74% BCI COTTON  21% RECYLED COTTON 5% ELASTANE";
    case "78CT22SPA":
      return "78%POLYESTER 22%SPANDEX";
    case "69BCI21RC1":
      return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
    case "78CN22SCL":
      return "78% COTTON, 22% SEA CELL";
    case "57%CT38%":
      return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
    case "69BCICT21E":
      return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
    case "CT96EL4":
      return "CO 96 % EL 4 %";
    case "57CTN38P5E":
      return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
    case "69CTN21REC":
      return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
    case "CT65PLY35":
      return "CKNA related one";
    case "CT98SP2":
      return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
    case "98CT2SPND":
      return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
    case "92CTN8PTR":
      return "CKNA related one";
    case "CT92EL8":
      return "CKNA related one";
    case "92CT8PEST":
      return "CKNA related one";
    case "PO100":
      return "PES 100 %";
    case "CT100SESU":
      return "100% COTTON";
    case "96MCRM4SPN":
      return "96% MICRO MODAL 4% ELASTANE";
    case "79NYL21ELS":
      return "79%POLYESTER21%ELASTANE";
    case "57CT38RP5S":
      return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
    case "57BC38CT5E":
      return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
    case "79NY21EL":
      return "79%POLYESTER21%ELASTANE";
    case "55CO37MO":
      return "CO 55 % CMD 37 % EL 8 %";
    case "97CTN3ELS":
      return "97% COTTON, 3% ELASTANE";
    case "55CT37MOD8":
      return "CO 55 % CMD 37 % EL 8 %";
    case "MDL65PLY35":
      return "CKNA related one";
    case "95BCICO5EL":
      return "95% COTTON 5% ELASTANE";
    case "87CN13ET":
      return "87% COTTON, 13% ELASTANE";
    case "74CT24RC2S":
      return "CO 74 % RCO 24 % EL 2 %";
    case "CT58RY39S3":
      return "CO 58 % RPE 39 % EL 3 %";
    case "85MOD9CA6":
      return "CMD 85 % WS 9 % EL 6 %";
    case "POLY75NY25":
      return "PES 75 % PA 25%";
    case "85%SI9%Ca6":
      return "CMD 85 % WS 9 % EL 6 %";
    case "SC95EL5":
      return "95% COTTON 5% ELASTANE";
    case "97MCMO3SPN":
      return "CMD 97 % EL 3 %";
    case "95CTN5SPX":
      return "95% COTTON 5% SPANDEX";
    case "96ORGCT4ES":
      return "CO 96 % EL 4 %";
    case "57CO38RE5":
      return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
    case "CT95SP5A":
      return "95% COTTON 5% SPANDEX";
    case "57CT38EST5":
      return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
    case "57CO36PO5S":
      return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
    case "PO55CT37":
      return "CO 55 % EL 8 % CMD 37 %";
    case "100CMPCT":
      return "100% COTTON";
    case "60CT40PLY":
      return "60% COTTON 40% POLYESTER";
    case "100BCICTTN":
      return "100% COTTON";
    case "100TENCEL":
      return "100% LYOCELL";
    case "74PET21T5E":
      return "74% BCI COTTON  21% RECYLED COTTON 5% ELASTANE";
    case "96%CT4%EL":
      return "CO 96 % EL 4 %";
    case "93ORCTN7EL":
      return "OCO 93 % EL 7 %";
    case "93BCICT7EL":
      return "OCO 93 % EL 7 %";
    case "TE100":
      return "100% LYOCELL";
    case "87PIM13LYC":
      return "87% PIMA COTTON, 13% LYCR";
    case "74CT24RT2E":
      return "CO 74 % RCO 24 % EL 2 %";
    case "CT93ELS7":
      return "93% COTTON 7% ELASTANE";
    case "100PEST":
      return "100% POLYESTER";
    case "100BCICMCT":
      return "CKNA related one";
    case "98BCICT2SP":
      return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
    case "TestFabric":
      return "TestFabric";
    default:
      return value;
  }
}

//need to complete
mapCountryandDestination(value){
  switch(value){
    case "NETHGA":
      return "NETHERLANDS";
    case "USA002":
      return "UNITED STATES";
    case "MEX001":
      return "MEXICO";
    case "USA001":
      return "UNITED STATES";
    case "CAN001":
      return "CANADA";
    case "PA02":
      return "PANAMA";
    case "AUS":
      return "AUSTRALIA";
    case "MEX01":
      return "MEXICO";
    case "IND02":
      return "INDIA";
    case "AHK":
      return "HONG KONG";
    case "PRC":
      return "CHINA";
    case "JPRTL":
      return "JAPAN";
    case "KOR":
      return "KOREA";
    case "JP01":
      return "JAPAN";
    case "IND03":
      return "INDIA";
    case "KRI01":
      return "KOREA";
    case "PRC01":
      return "CHINA";
    case "JP05":
      return "JAPAN";
    case "CAN02":
      return "CANADA";
    case "MEXICO":
      return "MEXICO";
    case "USA02":
      return "UNITED STATES";
    case "IND01":
      return "CHINA";
    case "PA01":
      return "PANAMA";
    case "AUS02":
      return "AUSTRALIA";
    case "Test":
      return "Test";
    default:
      return value;
  }
}

//need to complete
mapLineShipMethodandShipmentMode(value){
  switch(value){
    case "ARP":
      return "AIR";
    case "ARC":
      return "AIR";
    case "SEA":
      return "OCEAN";
    case "CRP":
      return "Private Parcel Service";
    case "CRC":
      return "Private Parcel Service";
    case "Test":
      return "Test";  
    default:
      return value;
  }
}

mapOrderTypeandCPO(value){
  const substring1 = "Ecom";
  const substring2 = "ECOM";

  if(value.includes(substring1) || value.includes(substring2) ) {
    return "ECOM";
  }else{
    return "PRD";
  }
}

  //Get OLR custsizedesc code 
  getOLR_CUSTSIZEDESC(custSize){
    if(custSize.includes('Ecom') || custSize.includes('ECOM')){
      return "ECOM";
    }else if(custSize.includes('Long') || custSize.includes('.L')){
      return "Long";
    }else{
      return "Reg"
    }
  } 

mapPOSourceandZOption(value){
  switch(value){
    case "USR":
      return "Retail";
    case "CNR":
      return "Retail";
    case "USW":
      return "Wholesale";
    case "CNW":
      return "Wholesale";
    default:
      return value;
  }
}

mapFactoryandMemberNameM3(value){
  switch(value){
    case "BFF":
      return "N09";
    // remove test
    case "Test":
      return "Test";
    default:
      return value;
  }
}

mapSizeandSize(value){
  if(value == "2XL") {
    return "2XL";
  }else if(value == "2XS"){
    return "2XS";
  }else if(value == "LG" || value == "L"){
    return "L";
  }else if(value == "MD" || value == "M"){
    return "M";
  }else if(value == "SM" || value == "S"){
    return "S";
  }else if(value == "XL"){
    return "XL";
  }else if(value == "XS"){
    return "XS"
  }else if(value == "XXL" || value == "2XL"){
    return "XXL";
  }else if(value == "2XS"){
    return "XXL";
  }else{
    return value;
  }
  }
}
