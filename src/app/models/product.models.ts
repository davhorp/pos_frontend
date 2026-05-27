export interface Product {
  id: string; // O number, según uses UUID o Long en base de datos
  name: string;
  barcode: string;
  price: number;
  stockQuantity: number;
  unitOfMeasure: string;
  imageUrl?: string;
  category: string;
}