
'use client';

import React from 'react';
import Image from 'next/image';

const MtnLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/9/93/MTN_Logo.svg" alt="MTN Mobile Money" fill style={{ objectFit: 'contain' }} />;
const VodafoneLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/0/0e/Vodafone_2017_logo.svg" alt="Vodafone Cash" fill style={{ objectFit: 'contain' }} />;
const AirtelTigoLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airtel_Tigo_Logo.svg" alt="AirtelTigo Money" fill style={{ objectFit: 'contain' }} />;

const VisaLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" fill style={{ objectFit: 'contain' }} />;
const MastercardLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" fill style={{ objectFit: 'contain' }} />;

const GcbLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/en/c/cb/GCB_Bank_logo.png" alt="GCB Bank" fill style={{ objectFit: 'contain' }} />;
const EcobankLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/1/15/Ecobank_logo.svg" alt="Ecobank" fill style={{ objectFit: 'contain' }} />;


export const paymentMethodIcons: { [key: string]: React.FC } = {
    mtn: MtnLogo,
    vodafone: VodafoneLogo,
    airteltigo: AirtelTigoLogo,
    visa: VisaLogo,
    mastercard: MastercardLogo,
    gcb: GcbLogo,
    ecobank: EcobankLogo,
};

    