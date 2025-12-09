/**
 * SEO Utility functions for generating standardized titles and descriptions
 */

const SITE_NAME = 'DomGo.rs';
const DEFAULT_LOCALE = 'sr';

/**
 * Truncates text to a specific length ensuring clean word breaks
 */
export function truncate(text: string, length: number): string {
    if (!text || text.length <= length) return text;
    return text.slice(0, length).trim() + '...';
}

/**
 * Generates a title for a property listing
 */
export function generatePropertyTitle(property: any, locale: 'sr' | 'ru' = 'sr'): string {
    if (!property) return SITE_NAME;

    const type = property.type === 'rent'
        ? (locale === 'ru' ? 'Аренда' : 'Izdavanje')
        : (locale === 'ru' ? 'Продажа' : 'Prodaja');

    const propType = property.property_type ? (
        locale === 'ru'
            ? (property.property_type === 'apartment' ? 'квартиры' : property.property_type === 'house' ? 'дома' : 'недвижимости')
            : (property.property_type === 'apartment' ? 'stana' : property.property_type === 'house' ? 'kuće' : 'nekretnine')
    ) : '';

    const city = property.city?.name || '';
    const price = property.price ? `${property.price.toLocaleString()}€` : '';

    // Format: Prodaja stana Beograd 150,000€ | DomGo.rs
    // Format RU: Продажа квартиры Белград 150,000€ | DomGo.rs
    const items = [type, propType, city, price].filter(Boolean);
    return `${items.join(' ')} | ${SITE_NAME}`;
}

/**
 * Generates a description for a property listing
 */
export function generatePropertyDescription(property: any, locale: 'sr' | 'ru' = 'sr'): string {
    if (!property) return '';

    // Use property description if available, otherwise construct one
    if (property.description) {
        return truncate(property.description, 160);
    }

    const parts = [];

    if (property.area) {
        parts.push(`${property.area} m²`);
    }

    if (property.rooms) {
        parts.push(locale === 'ru' ? `${property.rooms} комн.` : `${property.rooms} soba`);
    }

    if (property.location) {
        parts.push(property.location);
    }

    const baseDesc = parts.join(', ');
    const cta = locale === 'ru'
        ? 'Смотрите подробности и фото в приложении DomGo.'
        : 'Pogledajte detalje i fotografije u DomGo aplikaciji.';

    return `${baseDesc}. ${cta}`;
}

/**
 * Generates a title for an agency profile
 */
export function generateAgencyTitle(agency: any, locale: 'sr' | 'ru' = 'sr'): string {
    if (!agency) return SITE_NAME;

    const name = agency.name || (locale === 'ru' ? 'Агентство' : 'Agencija');
    const city = agency.city?.name ? `(${agency.city.name})` : '';

    return `${name} ${city} | ${SITE_NAME}`;
}
