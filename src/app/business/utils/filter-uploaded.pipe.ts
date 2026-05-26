import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterUploaded',
  standalone: true // Muy importante en Angular 18
})
export class FilterUploadedPipe implements PipeTransform {
  transform(items: any[] | null): any[] {
    return items ? items.filter(item => item.cargado) : [];
  }
}