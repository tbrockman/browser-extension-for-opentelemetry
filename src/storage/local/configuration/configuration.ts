import { Mixin } from "ts-mixer";
import { BackendConfiguration, type BackendConfigurationType } from "./backend";
import { ContentScriptConfiguration, type ContentScriptConfigurationType } from "./content-script";

export type ConfigurationType = BackendConfigurationType & ContentScriptConfigurationType
export class Configuration extends Mixin(BackendConfiguration, ContentScriptConfiguration) implements ConfigurationType { }
export const defaultConfiguration = new Configuration();
