import { useState } from 'react';
import TopBar from './components/TopBar';
import Inicio from './pages/Inicio';
import PreRegistro from './pages/PreRegistro';
import ConsultaArco from './pages/ConsultaArco';
import { WizardProvider } from './context/WizardContext';

export type Pagina = 'inicio' | 'registro' | 'arco';

export default function App() {
  const [pagina, setPagina] = useState<Pagina>('inicio');

  return (
    <WizardProvider>
      <TopBar pagina={pagina} onNavegar={setPagina} />
      <main className="contenido">
        {pagina === 'inicio' && <Inicio onNavegar={setPagina} />}
        {pagina === 'registro' && <PreRegistro />}
        {pagina === 'arco' && <ConsultaArco />}
      </main>
      <footer className="pie">
        ClinicConnect · Proyecto de entrenamiento · Todos los datos son ficticios
      </footer>
    </WizardProvider>
  );
}
