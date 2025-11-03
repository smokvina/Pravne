export interface Contact {
  email: string;
  phone: string;
}

export interface PartyValidationErrors {
  role?: string;
  name?: string;
  oib_or_id?: string;
  address?: string;
}

export interface UncertainField {
  field: string;
  value: string;
  reason: string;
}

export interface OcrResult {
  rawText: string;
  uncertainFields: UncertainField[];
}

export interface Party {
  id: string;
  role: string;
  name: string;
  oib_or_id: string;
  address: string;
  contacts: Contact;
  id_card_image_front_b64?: string;
  id_card_image_back_b64?: string;
  id_card_image_front_text?: string;
  id_card_image_back_text?: string;
  id_card_front_uncertain_fields?: UncertainField[];
  id_card_back_uncertain_fields?: UncertainField[];
  validationErrors?: PartyValidationErrors;
}

export interface ContractValidationErrors {
  contract_title?: string;
  contract_purpose?: string;
}

export interface ContractInput {
  contract_title: string;
  contract_purpose: string;
  parties: Party[];
  additional_instructions: string;
  validationErrors?: ContractValidationErrors;
}

export interface GenerationResult {
  markdown: string;
  json: string;
}