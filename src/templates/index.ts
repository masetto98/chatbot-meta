import { createFlow } from "@builderbot/bot";
import { mainFlow } from "./mainFlow";
import { operacionFlow } from "./operacionFlow";
import { faqFlow, finFlow } from "./faqFlow";
import { welcomeFlow } from "./welcomeFlow";
import { agendarFlow, visitaFlow,changeEvent,negativeChangeEvent } from "./agendarFlow";
import { ventasFlow } from "./ventasFlow";
import { backtoMenuFlow } from "./backtoMenuFlow";
import { desarrolloFlow } from "./desarrolloFlow";
import { tasacionFlow } from "./tasacionFlow";
import { agenteFlow } from "./agenteFlow";
import { agendarFlowAlquiler, changeEventAlquiler, negativeChangeEventAlq, visitaFlowAlquiler } from "./agendarFlowAlquiler";

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
      ,agenteFlow,
      visitaFlow,
      changeEvent,
      negativeChangeEvent,
      finFlow,
      agendarFlowAlquiler,
      visitaFlowAlquiler,
      changeEventAlquiler,
      negativeChangeEventAlq,
      
 ]);