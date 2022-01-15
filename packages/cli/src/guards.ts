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
  LoadedDataRaw,
  DataViewRaw,
  LoadedDataSimple,
  LoadedSource,
  LoadedSourceWithUnknown,
  LoadedSourceUnknown,
} from './types';

export const isDataTable = (item: Data): item is DataTable => item.type === 'Table';
export const isDataFunction = (item: Data): item is DataFunction => item.type === 'Function';
export const isDataEnum = (item: Data): item is DataEnum => item.type === 'Enum';

export const isLoadedDataTable = (item: LoadedData): item is LoadedDataTable => item.type === 'Table';
export const isLoadedDataFunction = (item: LoadedData): item is LoadedDataFunction => item.type === 'Function';
export const isLoadedDataEnum = (item: LoadedData): item is LoadedDataEnum => item.type === 'Enum';
export const isLoadedDataView = (item: LoadedData): item is LoadedDataView => item.type === 'View';
export const isLoadedDataComposite = (item: LoadedData): item is LoadedDataComposite => item.type === 'Composite';

export const isDataViewRaw = (item: LoadedDataRaw): item is DataViewRaw => item.type === 'View';
export const isNotDataViewRaw = (item: LoadedDataRaw): item is LoadedDataSimple => item.type !== 'View';

export const isLoadedSource = (item: LoadedSourceWithUnknown): item is LoadedSource => item.type !== 'Unknown';
export const isLoadedSourceUnknown = (item: LoadedSourceWithUnknown): item is LoadedSourceUnknown =>
  item.type === 'Unknown';
