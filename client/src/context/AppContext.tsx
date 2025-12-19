import { createContext } from 'react';
import { AppContextType } from '@shared/types';

export const AppContext = createContext<AppContextType | null>(null);
