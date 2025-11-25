import { supabase } from '@/lib/supabaseClient';
import { getOrganizations } from '@/lib/insightly';

export async function POST() {
    try {
        // Fetch organizations from Insightly
        const organizations = await getOrganizations();

        if (!organizations || organizations.length === 0) {
            return Response.json({ success: true, synced: 0 });
        }

        // Transform and insert into Supabase
        const orgsToInsert = organizations.map((org: any) => {
            // Parse addresses
            let billingAddress = {};
            let shippingAddress = {};

            if (org.ADDRESSES && Array.isArray(org.ADDRESSES)) {
                const billing = org.ADDRESSES.find((a: any) => a.ADDRESS_TYPE === 'BILLING');
                const shipping = org.ADDRESSES.find((a: any) => a.ADDRESS_TYPE === 'SHIPPING');

                if (billing) {
                    billingAddress = {
                        address_billing_street: billing.STREET,
                        address_billing_city: billing.CITY,
                        address_billing_state: billing.STATE,
                        address_billing_postcode: billing.POSTCODE,
                        address_billing_country: billing.COUNTRY,
                    };
                }

                if (shipping) {
                    shippingAddress = {
                        address_ship_street: shipping.STREET,
                        address_ship_city: shipping.CITY,
                        address_ship_state: shipping.STATE,
                        address_ship_postcode: shipping.POSTCODE,
                        address_ship_country: shipping.COUNTRY,
                    };
                }
            }

            // Parse contact infos
            let phone = null;
            let fax = null;
            let website = null;

            if (org.CONTACTINFOS && Array.isArray(org.CONTACTINFOS)) {
                const phoneInfo = org.CONTACTINFOS.find((c: any) => c.TYPE === 'PHONE');
                const faxInfo = org.CONTACTINFOS.find((c: any) => c.TYPE === 'FAX');
                const websiteInfo = org.CONTACTINFOS.find((c: any) => c.TYPE === 'WEBSITE');

                if (phoneInfo) phone = phoneInfo.DETAIL;
                if (faxInfo) fax = faxInfo.DETAIL;
                if (websiteInfo) website = websiteInfo.DETAIL;
            }

            return {
                insightly_id: org.ORGANISATION_ID,
                name: org.ORGANISATION_NAME,
                background: org.BACKGROUND,
                image_url: org.IMAGE_URL,
                owner_user_id: org.OWNER_USER_ID,
                date_created_utc: org.DATE_CREATED_UTC,
                date_updated_utc: org.DATE_UPDATED_UTC,
                visible_to: org.VISIBLE_TO,
                visible_team_id: org.VISIBLE_TEAM_ID,
                visible_user_ids: org.VISIBLE_USER_IDS,
                customfields: org.CUSTOMFIELDS,
                ...billingAddress,
                ...shippingAddress,
                phone,
                phone_fax: fax,
                website,
            };
        });

        // Upsert organizations
        const { error } = await supabase
            .from('organizations')
            .upsert(orgsToInsert, {
                onConflict: 'insightly_id',
                ignoreDuplicates: false,
            });

        if (error) throw error;

        // Update sync status
        await supabase
            .from('sync_status')
            .upsert(
                {
                    entity_type: 'organizations',
                    last_sync_at: new Date().toISOString(),
                    sync_status: 'success',
                    records_synced: orgsToInsert.length,
                },
                { onConflict: 'entity_type' }
            );

        return Response.json({ success: true, synced: orgsToInsert.length });
    } catch (error: any) {
        console.error('Error syncing organizations:', error);
        // Update sync status with error
        await supabase
            .from('sync_status')
            .upsert(
                {
                    entity_type: 'organizations',
                    last_sync_at: new Date().toISOString(),
                    sync_status: 'error',
                    error_message: error.message,
                },
                { onConflict: 'entity_type' }
            );
        return Response.json({ error: error.message }, { status: 500 });
    }
}
