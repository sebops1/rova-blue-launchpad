-- Allow the public teaser page to submit waitlist and partner enquiries only.
GRANT INSERT (name, email, phone, message, source, desired_package, party_size, desired_date, status) ON public.leads TO anon;
GRANT INSERT (name, contact_name, email, phone, message, partner_type, status) ON public.partners TO anon;

CREATE POLICY "Public can submit waitlist enquiries"
ON public.leads FOR INSERT TO anon
WITH CHECK (source = 'Website waitlist' AND status = 'New Lead');

CREATE POLICY "Public can submit partner enquiries"
ON public.partners FOR INSERT TO anon
WITH CHECK (status = 'Inbound Enquiry');