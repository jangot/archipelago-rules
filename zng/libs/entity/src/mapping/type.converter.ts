export class TypeConverter {
  public static convert(value: any, targetType: any): any {
    if (value === undefined || value === null) return value;

    switch (targetType) {
      case String:
        return String(value);
      case Number:
        return Number(value);
      case Boolean:
        return value === 'true' || value === '1' || value === true;
      case Date:
        return new Date(value);
      default:
        return value;
    }
  }
}
