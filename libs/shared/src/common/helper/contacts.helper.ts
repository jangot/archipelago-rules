import { ContactType } from '@library/entity/enum';

export interface ContactValue {
  value: string;
  type: ContactType
}

export function parseContactUri(contactUri: string): ContactValue | null {
  const [protocol, value] = contactUri.split(':');
  switch (protocol) {
    case 'mailto':
      return { value, type: ContactType.EMAIL };
    case 'tel':
      return { value, type: ContactType.PHONE_NUMBER };
    default:
      return null;
  }
}
