import { createFlow } from "@builderbot/bot";
import { mainFlow } from "./mainFlow";
import { operacionFlow } from "./operacionFlow";
import { faqFlow } from "./faqFlow";
import { welcomeFlow } from "./welcomeFlow";
import { agendarFlow } from "./agendarFlow";
import { ventasFlow } from "./ventasFlow";
import { backtoMenuFlow } from "./backtoMenuFlow";
import { desarrolloFlow } from "./desarrolloFlow";
import { tasacionFlow } from "./tasacionFlow";
import { agenteFlow } from "./agenteFlow";

 export default createFlow([
      mainFlow,
      welcomeFlow,
      operacionFlow,
      faqFlow,
      agendarFlow,
      ventasFlow,
      backtoMenuFlow,
      desarrolloFlow,
      tasacionFlow
      ,agenteFlow
      
 ]);