import {
  Data,
  DataEnum,
  DataFunction,
  DataTable,
  LoadedData,
  LoadedDataEnum,
  LoadedDataFunction,
  LoadedDataTable,
  LoadedDataView,
  LoadedDataComposite,
} from './types';

export const isDataTable = (item: Data): item is DataTable => item.type === 'Table';
export const isDataFunction = (item: Data): item is DataFunction => item.type === 'Function';
export const isDataEnum = (item: Data): item is DataEnum => item.type === 'Enum';

export const isLoadedDataTable = (item: LoadedData): item is LoadedDataTable => item.type === 'Table';
export const isLoadedDataFunction = (item: LoadedData): item is LoadedDataFunction => item.type === 'Function';
export const isLoadedDataEnum = (item: LoadedData): item is LoadedDataEnum => item.type === 'Enum';
export const isLoadedDataView = (item: LoadedData): item is LoadedDataView => item.type === 'View';
export const isLoadedDataComposite = (item: LoadedData): item is LoadedDataComposite => item.type === 'Composite';
