import { Header } from "./Header";
import { WizardSteps } from "./WizardSteps";

export const MainContent: React.FC = () => (
  <div className="mx-auto flex h-screen max-w-2xl flex-col overflow-hidden p-4 md:p-8">
    <Header />
    <WizardSteps />
  </div>
);
