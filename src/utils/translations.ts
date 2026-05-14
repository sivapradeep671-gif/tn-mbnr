export const translations = {
    en: {
        nav: {
            home: "Home",
            register: "Register",
            map: "Map",
            report: "Report",
            login: "Login",
            admin: "Admin",
            scan_qr: "Scan QR",
            inspector: "Inspection Hub",
            marketplace: "Services",
            pricing: "Pricing",
            saas_admin: "Control Center"
        },
        hero: {
            badge: "TN-MBNR Trust Network Pilot",
            title_prefix: "TN-MBNR",
            title_suffix: "TrustReg TN Pilot",
            subtitle: "Scan once, know the truth. Tamper-Resistant QR for Municipal Business Verification.",
            cta_register: "Register Business",
            cta_dashboard: "View Live Dashboard",
            features: {
                ai: {
                    title: "AI Protection",
                    desc: "Smart algorithms block copycats and detect counterfeit logos instantly."
                },
                blockchain: {
                    title: "Blockchain Trust",
                    desc: "Tamper-proof registration history ensures your brand ownership is undeniable."
                },
                community: {
                    title: "Community Power",
                    desc: "Citizens scan QR codes to verify shops, creating a trusted ecosystem."
                }
            }
        },
        impact: {
            title: "Impact Matrix",
            subtitle: "Measuring the revolution. How TrustReg TN transforms the business landscape.",
            columns: {
                dimension: "Dimension",
                advantage: "Advantage"
            },
            rows: [
                { dim: "Consumer Safety", adv: "70% reduction in counterfeit products (Simulated based on 100 shop pilot)" },
                { dim: "Business Protection", adv: "Prevents brand misuse; legal recourse is easier" },
                { dim: "Municipal Revenue", adv: "₹3-10 Crore annually (Projected based on 50k shops)" },
                { dim: "Technology", adv: "World-class AI, blockchain, cloud infrastructure" },
                { dim: "Scalability", adv: "Can be replicated to other states and countries" },
                { dim: "Transparency", adv: "Citizens can verify businesses instantly" },
                { dim: "Enforcement", adv: "Proactive AI-based (vs. manual complaint-based)" },
                { dim: "Time Efficiency", adv: "Instant verification (vs. 7 days today)" },
                { dim: "Data Accuracy", adv: "Automated validation (vs. manual entry errors)" },
                { dim: "Institutional Trust", adv: "Banks and investors can verify businesses digitally" }
            ],
            note: "* Projected from TN‑MBNR model. Consistent with slide deck."
        },
        register: {
            title: "Business Registration",
            verify_ai: "Verify with AI",
            category: "Business Category",
            proof_address: "Proof of Address",
            submit: "Register Business",
            success: "Business Registered Successfully!",
            error: "Registration Failed",
            labels: {
                legal_name: "Legal Name",
                trade_name: "Trade Name",
                type: "Business Type",
                gst: "GST Number",
                address: "Address",
                branch: "Branch Name",
                contact: "Contact Number",
                logo: "Business Logo",
                upload_logo: "Upload Logo for AI Analysis",
                save_draft: "Save Draft",
                verify_proceed: "Verify & Proceed",
                municipal_ward: "Municipal Ward No.",
                nic_category: "NIC Industry Category",
                employee_count: "Employee Count",
                aadhaar_secure: "Aadhaar Number (Secure Entry)"
            },
            placeholders: {
                legal_name: "e.g., Sri Krishna Sweets Pvt Ltd",
                trade_name: "Name displayed on signboard",
                gst: "Optional",
                address: "Full physical address",
                branch: "e.g., Main Branch, Anna Nagar"
            },
            qr: {
                title: "Business Verified",
                desc: "Scan this QR code to verify details",
                download: "Download QR Code"
            }
        },
        map: {
            title: "Business Map Explorer",
            search_placeholder: "Search area...",
            filter: "Filter"
        },
        report: {
            title: "Report Suspicious Business",
            labels: {
                name: "Business Name",
                location: "Location / Address",
                upload: "Upload Photo Evidence"
            },
            placeholders: {
                name: "Name of the shop",
                location: "Where is it located?"
            },
            submit: "Submit Report",
            subtitle: "Your report will be processed by municipal authorities.",
            categories: {
                label: "Issue Category",
                options: {
                    fraud_qr: "Fraudulent QR",
                    price_gouging: "Price Gouging",
                    improper_weight: "Improper Weight",
                    counterfeit: "Counterfeit Goods",
                    hygiene: "Poor Hygiene",
                    other: "Other"
                }
            },
            severity: {
                label: "Severity Level",
                options: {
                    low: "Low",
                    medium: "Medium",
                    high: "High",
                    urgent: "Urgent"
                }
            },
            camera: {
                live: "Live Camera",
                upload: "Upload File",
                take_photo: "Take a photo of the incident",
                capture: "Capture",
                cancel: "Cancel",
                change: "Change Photo",
                preview: "Preview"
            },
            disclaimer: "Blockchain Verification: Your report fingerprint will be stored on-chain for accountability while maintaining your personal anonymity. Misuse of this system is subject to legal action."
        },
        scanner: {
            title: "Scan QR",
            privacy: "PRIVACY NOTICE: This scanner requires transient GPS access to verify business location. We do not store your precise coordinates after the verification is complete.",
            ar_active: "AR SCANNER ACTIVE",
            point_camera: "Point your camera at a TrustReg TN Business QR Code",
            status: {
                valid: "✅ VERIFIED BUSINESS",
                location_mismatch: "⚠️ LOCATION MISMATCH",
                expired: "⏳ TOKEN EXPIRED",
                suspicious: "🚨 SUSPICIOUS SCAN"
            },
            messages: {
                valid: "This shop is VERIFIED at this location. It is safe to transact with this business.",
                location_mismatch: "WARNING: This QR code is registered to another location. Possible stolen identity.",
                expired: "WARNING: Verification token has expired. Please ask the merchant to refresh their QR.",
                counterfeit: "FRAUD ALERT: This QR code is identified as counterfeit or malformed. DO NOT PAY."
            },
            labels: {
                secure: "Secure",
                warning: "Warning",
                danger: "Danger",
                business_name: "Business Name",
                legal_name: "Owner / Legal Name",
                gst: "GST Number",
                status: "Status",
                gov_verified: "Government Verified",
                license_status: "License Status",
                reg_location: "Registered Location",
                business_id: "Business ID",
                ward: "Municipal Ward",
                sla_deadline: "SLA Deadline"
            },
            errors: {
                geo_unsupported: "Geolocation is not supported by your browser",
                network: "Verification Failed: Network Error",
                denied: "Location Access Denied. Cannot verify Geofence.",
                failed: "Scan Failed"
            },
            license: {
                days_remaining: "days remaining",
                days_overdue: "days overdue",
                do_not_transact: "DO NOT TRANSACT"
            },
            actions: {
                scan_another: "Scan Another",
                report: "Report Business",
                try_again: "Try Again"
            }
        },
        footer: {
            rights: "© 2024 TrustReg TN Pilot Project. This is a prototype concept, not an official government portal.",
            disclaimer_banner: "UNOFFICIAL DEMO PROJECT - NOT AN OFFICIAL GOVT SERVICE",
            disclaimer: "DISCLAIMER: This is an enterprise research platform part of the TN-MBNR TrustReg TN Pilot. This is NOT an official service of the Government of Tamil Nadu."
        },
        tech_stack: {
            title: "Technical Architecture",
            subtitle: "Built with scalable government-grade technologies.",
            frontend: "Citizen PWA & Admin Portal (React/Next.js)",
            backend: "API Gateway & Microservices (Scalable)",
            db: "Secure Storage: PostgreSQL (Encrypted)",
            ai: "AI Fraud Engine: Anomaly Detection Models",
            blockchain: "Permissioned Ledger: Audit Trail & Integrity"
        },
        hackathon: {
            title: "For Hackathon Jury",
            problem: "Problem: Counterfeit businesses and unchecked name duplication cause revenue loss and consumer distrust.",
            solution: "Solution: An AI-powered, Blockchain-backed digital identity system for municipal business verification.",
            impact_title: "Key Impact:",
            impact_points: [
                "Automated verification reduces admin workload by 90%",
                "Tamper-proof records build institutional trust",
                "Community-driven verification empowers citizens"
            ],
            roadmap: "Future: Integration with GST, UDYAM, and statewide roll-out."
        },
        citizen_reg: {
            title: "Citizen Access",
            subtitle: "Secure your digital identity on the regional trust grid to verify commercial assets and report anomalies.",
            initiate: "Initiate KYC Verification",
            step2_title: "Identity Match",
            step2_subtitle: "Biometric Aadhaar Linkage",
            labels: {
                aadhaar: "Aadhaar Number",
                mobile: "Mobile Number (Linked)"
            },
            placeholders: {
                aadhaar: "XXXX XXXX XXXX",
                mobile: "+91 XXXXX XXXXX"
            },
            submit: "Generate Secure OTP",
            verifying: "Verifying Node Access...",
            success_title: "Registration Complete",
            success_subtitle: "Your citizen profile is now verified. Access to regional scanning and anomaly reporting is activated.",
            enter: "Enter Command Center"
        },
        inspector: {
            title: "Municipal Scrutiny",
            subtitle: "Field Officer Command Hub",
            stats: {
                awaiting: "Awaiting Action",
                risk: "High Risk Nodes",
                inspected: "Inspected Today",
                live: "Live Audits"
            },
            tabs: {
                scrutiny: "Primary Scrutiny",
                simulator: "Field Audit Simulator",
                history: "Registry History"
            },
            ai: {
                invoke: "Invoke Gemini Scrutiny",
                analyzing: "Quantum Scrutiny Active...",
                cleared: "Standard Clearance Verified",
                flagged: "High Awareness Flag"
            },
            simulator: {
                title: "Auditor Control",
                subtitle: "Field Simulation",
                target: "Select Target Node",
                choose: "Choose a Verified Business...",
                distance: "Simulated Distance",
                mismatch: "Mismatch",
                internal: "Internal",
                initiate: "Initialize Field Audit",
                pulsing: "Broadcasting Pulse...",
                passed: "Audit Passed",
                breach: "Security Breach",
                score: "Audit Score",
                risk: "Distance Risk",
                payload: "Signed Proof Payload",
                telemetry: [
                    "Initializing Secure Node...",
                    "Fetching Registrar Key...",
                    "Calculating Geofence...",
                    "Comparing HMAC Signatures...",
                    "Finalizing Blockchain Entry..."
                ]
            }
        },
        merchant: {
            compliance: "Compliance Cluster",
            tax_property: "Property Tax",
            tax_water: "Water Charges",
            tax_professional: "Professional Tax",
            settle_dues: "Settle Outstanding Dues"
        },
        executive: {
            title: "Strategic Command",
            subtitle: "Municipal Oversight Hub",
            kpis: {
                revenue: "Total Revenue Yield",
                compliance: "Compliance Index",
                risk: "High-Risk Nodes",
                verified: "Verified Businesses"
            },
            wards: {
                title: "Ward Performance",
                analytics: "Integrity vs Revenue Delta"
            },
            alerts: {
                title: "Strategic Alerts",
                global_map: "Global Risk Map"
            }
        },
        voice: {
            placeholder: "Search by voice or command...",
            listening: "System listening...",
            captured: "Speech captured",
            error: "Speech error"
        }
    },
    ta: {
        nav: {
            home: "முகப்பு",
            register: "பதிவு",
            map: "வரைபடம்",
            report: "புகார்",
            login: "உள்நுழை",
            admin: "நிர்வாகம்",
            scan_qr: "QR ஸ்கேன்",
            inspector: "ஆய்வு மையம்",
            marketplace: "சேவைகள்",
            pricing: "விலை",
            saas_admin: "கட்டுப்பாட்டு மையம்"
        },
        hero: {
            badge: "TN-MBNR நம்பிக்கை நெட்வொர்க் முன்னோடி",
            title_prefix: "TN-MBNR",
            title_suffix: "TrustReg TN Pilot",
            subtitle: "ஒரு முறை ஸ்கேன் செய்யுங்கள், உண்மையை அறியுங்கள். நகராட்சி வணிகச் சரிபார்ப்பிற்கான சேதமில்லாத QR.",
            cta_register: "வணிகத்தைப் பதிவுசெய்க",
            cta_dashboard: "நேரடி தரவு பலகையைப் பார்க்கவும்",
            features: {
                ai: {
                    title: "AI பாதுகாப்பு",
                    desc: "ஸ்மார்ட் அல்காரிதம்கள் போலிகளைத் தடுக்கின்றன மற்றும் போலி லோகோக்களை உடனடியாகக் கண்டறிகின்றன."
                },
                blockchain: {
                    title: "பிளாக்செயின் நம்பிக்கை",
                    desc: "மாற்ற முடியாத பதிவு வரலாறு உங்கள் பிராண்ட் உரிமையை உறுதி செய்கிறது."
                },
                community: {
                    title: "சமூக சக்தி",
                    desc: "குடிமக்கள் கடைகளைச் சரிபார்க்க QR குறியீடுகளை ஸ்கேன் செய்து, நம்பகமான சூழலை உருவாக்குகிறார்கள்."
                }
            }
        },
        impact: {
            title: "தாக்க அணி",
            subtitle: "புரட்சியை அளவிடுதல். TrustReg TN வணிக நிலப்பரப்பை எவ்வாறு மாற்றுகிறது.",
            columns: {
                dimension: "பரிமாணம்",
                advantage: "நன்மை"
            },
            rows: [
                { dim: "நுகர்வோர் பாதுகாப்பு", adv: "போலி தயாரிப்புகளில் 70% குறைப்பு (100 கடைகளின் அடிப்படையில் கணிக்கப்பட்டது)" },
                { dim: "வணிகப் பாதுகாப்பு", adv: "பிராண்ட் தவறாகப் பயன்படுத்துவதைத் தடுக்கிறது" },
                { dim: "நகராட்சி வருவாய்", adv: "ஆண்டுக்கு ₹3-10 கோடி (மதிப்பிடப்பட்டது)" },
                { dim: "தொழில்நுட்பம்", adv: "உலகத் தரம் வாய்ந்த AI, பிளாக்செயின்" },
                { dim: "அளவிடுதல்", adv: "பிற மாநிலங்களுக்கும் விரிவுபடுத்தலாம்" },
                { dim: "வெளிப்படைத்தன்மை", adv: "குடிமக்கள் உடனடியாகச் சரிபார்க்கலாம்" },
                { dim: "அமலாக்கம்", adv: "செயலில் உள்ள AI அடிப்படையிலான கண்காணிப்பு" },
                { dim: "நேரத் திறன்", adv: "உடனடி சரிபார்ப்பு (7 நாட்கள் அல்ல)" },
                { dim: "தரவு துல்லியம்", adv: "தானியங்கி சரிபார்ப்பு" },
                { dim: "நிறுவன நம்பிக்கை", adv: "டிஜிட்டல் நம்பகத்தன்மை" }
            ],
            note: "* TN‑MBNR மாதிரியிலிருந்து கணிக்கப்பட்டது. விளக்கக்காட்சியுடன் ஒத்துப்போகிறது."
        },
        register: {
            title: "வணிகப் பதிவு",
            verify_ai: "AI மூலம் சரிபார்க்கவும்",
            category: "வணிக வகை",
            proof_address: "முகவரி சான்று",
            submit: "வணிகத்தைப் பதிவுசெய்க",
            success: "வணிகம் வெற்றிகரமாக பதிவு செய்யப்பட்டது!",
            error: "பதிவு தோல்வியடைந்தது",
            labels: {
                legal_name: "சட்டப்பூர்வ பெயர்",
                trade_name: "வணிகப் பெயர்",
                type: "வணிக வகை",
                gst: "GST எண்",
                address: "முகவரி",
                branch: "கிளை பெயர்",
                contact: "தொடர்பு எண்",
                logo: "வணிக லோகோ",
                upload_logo: "AI பகுப்பாய்விற்காக லோகோவை பதிவேற்றவும்",
                save_draft: "வரைவைச் சேமி",
                verify_proceed: "சரிபார்த்து தொடரவும்",
                municipal_ward: "நகராட்சி வார்டு எண்",
                nic_category: "NIC தொழில் வகை",
                employee_count: "ஊழியர் எண்ணிக்கை",
                aadhaar_secure: "ஆதார் எண் (பாதுகாப்பான பதிவு)"
            },
            placeholders: {
                legal_name: "எ.கா., ஸ்ரீ கிருஷ்ணா ஸ்வீட்ஸ் பிரைவேட் லிமிடெட்",
                trade_name: "பெயர் பலகையில் உள்ள பெயர்",
                gst: "விருப்பத்தேர்வு",
                address: "முழு முகவரி",
                branch: "எ.கா., பிரதான கிளை, அண்ணா நகர்"
            },
            qr: {
                title: "வணிகம் சரிபார்க்கப்பட்டது",
                desc: "விவரங்களைச் சரிபார்க்க இந்த QR குறியீட்டை ஸ்கேன் செய்யவும்",
                download: "QR குறியீட்டைப் பதிவிறக்கவும்"
            }
        },
        map: {
            title: "வணிக வரைபட ஆய்வாளர்",
            search_placeholder: "பகுதியைத் தேடுங்கள்...",
            filter: "வடிகட்டி"
        },
        report: {
            title: "சந்தேகத்திற்குரிய வணிகத்தைப் புகாரளிக்கவும்",
            labels: {
                name: "வணிகப் பெயர்",
                location: "இடம் / முகவரி",
                upload: "புகைப்பட ஆதாரத்தைப் பதிவேற்றவும்"
            },
            placeholders: {
                name: "கடையின் பெயர்",
                location: "அது எங்கே அமைந்துள்ளது?"
            },
            submit: "புகாரைச் சமர்ப்பிக்கவும்",
            subtitle: "உங்கள் அறிக்கை நகராட்சி அதிகாரிகளால் செயல்படுத்தப்படும்.",
            categories: {
                label: "பிரச்சனை வகை",
                options: {
                    fraud_qr: "மோசடியான QR",
                    price_gouging: "விலை ஏற்றம்",
                    improper_weight: "முறையற்ற எடை",
                    counterfeit: "போலி பொருட்கள்",
                    hygiene: "மோசமான சுகாதாரம்",
                    other: "மற்றவை"
                }
            },
            severity: {
                label: "தீவிரத்தன்மை",
                options: {
                    low: "குறைந்த",
                    medium: "நடுத்தர",
                    high: "அதிக",
                    urgent: "அவசரம்"
                }
            },
            camera: {
                live: "நேரடி கேமரா",
                upload: "கோப்பைப் பதிவேற்றவும்",
                take_photo: "சம்பவத்தை புகைப்படம் எடுக்கவும்",
                capture: "பிடிக்கவும்",
                cancel: "ரத்துசெய்",
                change: "புகைப்படத்தை மாற்றவும்",
                preview: "முன்னோட்டம்"
            },
            disclaimer: "பிளாக்செயின் சரிபார்ப்பு: உங்கள் அறிக்கையின் கைரேகை பொறுப்புக்கூறலுக்காக செயினில் சேமிக்கப்படும், ஆனால் உங்கள் தனிப்பட்ட அடையாளம் பாதுகாக்கப்படும். இந்த அமைப்பை தவறாகப் பயன்படுத்தினால் சட்ட நடவடிக்கை எடுக்கப்படும்."
        },
        scanner: {
            title: "QR ஸ்கேன்",
            privacy: "தனியுரிமை அறிவிப்பு: வணிக இருப்பிடத்தைச் சரிபார்க்க இந்த ஸ்கேனருக்கு தற்காலிக ஜிபிஎஸ் அணுகல் தேவை. சரிபார்ப்பு முடிந்ததும் உங்கள் துல்லியமான ஆயத்தொலைவுகளை நாங்கள் சேமிப்பதில்லை.",
            ar_active: "AR ஸ்கேனர் செயலில் உள்ளது",
            point_camera: "TrustReg TN வணிக QR குறியீட்டை நோக்கி உங்கள் கேமராவைத் திருப்பவும்",
            status: {
                valid: "✅ சரிபார்க்கப்பட்ட வணிகம்",
                location_mismatch: "⚠️ இருப்பிடம் பொருந்தவில்லை",
                expired: "⏳ டோக்கன் காலாவதியானது",
                suspicious: "🚨 சந்தேகத்திற்குரிய ஸ்கேன்"
            },
            messages: {
                valid: "இந்த கடை இந்த இடத்தில் சரிபார்க்கப்பட்டது. இந்த வணிகத்துடன் பரிவர்த்தனை செய்வது பாதுகாப்பானது.",
                location_mismatch: "எச்சரிக்கை: இந்த QR குறியீடு வேறு இடத்தில் பதிவு செய்யப்பட்டுள்ளது. அடையாளம் திருடப்பட்டிருக்கலாம்.",
                expired: "எச்சரிக்கை: சரிபார்ப்பு டோக்கன் காலாவதியானது. வணிகரிடம் தங்கள் QR-ஐ புதுப்பிக்குமாறு கேட்கவும்.",
                counterfeit: "மோசடி எச்சரிக்கை: இந்த QR குறியீடு போலானது அல்லது தவறாக உருவாக்கப்பட்டது. பணம் செலுத்த வேண்டாம்."
            },
            labels: {
                secure: "பாதுகாப்பான",
                warning: "எச்சரிக்கை",
                danger: "ஆபத்து",
                business_name: "வணிகப் பெயர்",
                legal_name: "உரிமையாளர் / சட்டப்பூர்வ பெயர்",
                gst: "GST எண்",
                status: "நிலை",
                gov_verified: "அரசு சரிபார்க்கப்பட்டது",
                license_status: "உரிமம் நிலை",
                reg_location: "பதிவு செய்யப்பட்ட இடம்",
                business_id: "வணிக ஐடி",
                ward: "நகராட்சி வார்டு",
                sla_deadline: "SLA காலக்கெடு"
            },
            errors: {
                geo_unsupported: "உங்கள் உலாவியில் புவி இருப்பிடம் ஆதரிக்கப்படவில்லை",
                network: "சரிபார்ப்பு தோல்வியடைந்தது: பிணைய பிழை",
                denied: "இருப்பிட அணுகல் மறுக்கப்பட்டது. ஜியோஃபென்ஸைச் சரிபார்க்க முடியவில்லை.",
                failed: "ஸ்கேன் தோல்வியடைந்தது"
            },
            license: {
                days_remaining: "நாட்கள் மீதமுள்ளன",
                days_overdue: "நாட்கள் காலாவதியாகிவிட்டன",
                do_not_transact: "பரிவர்த்தனை செய்ய வேண்டாம்"
            },
            actions: {
                scan_another: "மற்றொன்றை ஸ்கேன் செய்",
                report: "வணிகத்தைப் புகாரளிக்கவும்",
                try_again: "மீண்டும் முயற்சிக்கவும்"
            }
        },
        footer: {
            rights: "© 2024 TrustReg TN முன்னோடித் திட்டம். இது ஒரு முன்மாதிரி கருத்துரு மட்டுமே.",
            disclaimer_banner: "அதிகாரப்பூர்வமற்ற டெமோ திட்டம் - அரசு சேவை அல்ல",
            disclaimer: "பொறுப்புத் துறப்பு: இது TN-MBNR TrustReg TN பைலட்டின் ஒரு பகுதியான நிறுவன ஆராய்ச்சி தளம். இது தமிழ்நாடு அரசின் அதிகாரப்பூர்வ சேவை அல்ல."
        },
        tech_stack: {
            title: "தொழில்நுட்ப கட்டமைப்பு",
            subtitle: "அளவிடுதல் மற்றும் பாதுகாப்புக்காக அரசு தரநிலை தொழில்நுட்பங்கள்.",
            frontend: "குடிமக்கள் செயலி மற்றும் நிர்வாக தளம் (React/Next.js)",
            backend: "API கேட்வே மற்றும் மைக்ரோ சர்வீசஸ்",
            db: "பாதுகாப்பான சேமிப்பு: PostgreSQL (Encrypted)",
            ai: "AI மோசடி தடுப்பு இயந்திரம்",
            blockchain: "அனுமதிக்கப்பட்ட லெட்ஜர்: தணிக்கை மற்றும் நேர்மை"
        },
        hackathon: {
            title: "நடுவர்களுக்கான குறிப்பு",
            problem: "பிரச்சனை: போலி வணிகங்கள் மற்றும் பெயர் நகலெடுப்பு.",
            solution: "தீர்வு: AI மற்றும் பிளாக்செயின் அடிப்படையிலான டிஜிட்டல் அடையாள அமைப்பு.",
            impact_title: "முக்கிய தாக்கம்:",
            impact_points: [
                "நிர்வாக பணிச்சுமையைக் குறைக்கிறது",
                "மாற்ற முடியாத பதிவுகள்",
                "சமூக அடிப்படையிலான சரிபார்ப்பு"
            ],
            roadmap: "எதிர்காலம்: GST மற்றும் UDYAM ஒருங்கிணைப்பு."
        },
        citizen_reg: {
            title: "குடிமக்கள் அணுகல்",
            subtitle: "வணிகச் சொத்துக்களைச் சரிபார்க்கவும் முறைகேடுகளைப் புகாரளிக்கவும் பிராந்திய நம்பிக்கை கிரிட்டில் உங்களின் டிஜிட்டல் அடையாளத்தைப் பாதுகாக்கவும்.",
            initiate: "KYC சரிபார்ப்பைத் தொடங்கவும்",
            step2_title: "அடையாளப் பொருத்தம்",
            step2_subtitle: "பயோமெட்ரிக் ஆதார் இணைப்பு",
            labels: {
                aadhaar: "ஆதார் எண்",
                mobile: "மொபைல் எண் (இணைக்கப்பட்டது)"
            },
            placeholders: {
                aadhaar: "XXXX XXXX XXXX",
                mobile: "+91 XXXXX XXXXX"
            },
            submit: "பாதுகாப்பான OTP ஐ உருவாக்கவும்",
            verifying: "அணுகல் சரிபார்க்கப்படுகிறது...",
            success_title: "பதிவு முடிந்தது",
            success_subtitle: "உங்கள் குடிமகன் சுயவிவரம் இப்போது சரிபார்க்கப்பட்டது. பிராந்திய ஸ்கேனிங் மற்றும் புகாரளிக்கும் அணுகல் செயல்படுத்தப்பட்டது.",
            enter: "கட்டளை மையத்திற்குள் நுழையுங்கள்"
        },
        inspector: {
            title: "நகராட்சி ஆய்வு",
            subtitle: "கள அலுவலர் கட்டளை மையம்",
            stats: {
                awaiting: "நடவடிக்கைக்காகக் காத்திருக்கிறது",
                risk: "உயர் அபாய முனையங்கள்",
                inspected: "இன்று ஆய்வு செய்யப்பட்டது",
                live: "நேரடி ஆய்வுகள்"
            },
            tabs: {
                scrutiny: "முதன்மை ஆய்வு",
                simulator: "கள ஆய்வு சிமுலேட்டர்",
                history: "பதிவு வரலாறு"
            },
            ai: {
                invoke: "ஜெமினி ஆய்வைத் தொடங்கு",
                analyzing: "AI ஆய்வு செயலில் உள்ளது...",
                cleared: "சாதாரண அனுமதி சரிபார்க்கப்பட்டது",
                flagged: "உயர் விழிப்புணர்வு கொடி"
            },
            simulator: {
                title: "ஆய்வாளர் கட்டுப்பாடு",
                subtitle: "கள ஆய்வு",
                target: "இலக்கு முனையத்தைத் தேர்ந்தெடுக்கவும்",
                choose: "சரிபார்க்கப்பட்ட வணிகத்தைத் தேர்ந்தெடுக்கவும்...",
                distance: "செயற்கை தூரம்",
                mismatch: "பொருத்தமின்மை",
                internal: "உட்புறம்",
                initiate: "கள ஆய்வைத் தொடங்கு",
                pulsing: "சிக்னல் ஒளிபரப்பப்படுகிறது...",
                passed: "ஆய்வு முடிந்தது",
                breach: "பாதுகாப்பு மீறல்",
                score: "ஆய்வு மதிப்பெண்",
                risk: "தொலைவு அபாயம்",
                payload: "கையொப்பமிட்ட ஆதாரம்",
                telemetry: [
                    "பாதுகாப்பான முனையத்தைத் தொடங்குகிறது...",
                    "பதிவு விசையைப் பெறுகிறது...",
                    "ஜியோஃபென்ஸ் கணக்கிடுகிறது...",
                    "HMAC கையெழுத்தை ஒப்பிடுகிறது...",
                    "பிளாக்செயின் பதிவை முடிக்கிறது..."
                ]
            }
        },
        merchant: {
            compliance: "இணக்கத் தொகுப்பு",
            tax_property: "சொத்து வரி",
            tax_water: "குடிநீர் கட்டணம்",
            tax_professional: "தொழில் வரி",
            settle_dues: "நிலுவைத் தொகையைச் செலுத்துங்கள்"
        },
        executive: {
            title: "மூலோபாய கட்டளை",
            subtitle: "நகராட்சி கண்காணிப்பு மையம்",
            kpis: {
                revenue: "மொத்த வருவாய் ஈட்டல்",
                compliance: "இணக்கக் குறியீடு",
                risk: "உயர் அபாய முனையங்கள்",
                verified: "சரிபார்க்கப்பட்ட வணிகங்கள்"
            },
            wards: {
                title: "வார்டு செயல்திறன்",
                analytics: "நேர்மை vs வருவாய் தரவு"
            },
            alerts: {
                title: "மூலோபாய எச்சரிக்கைகள்",
                global_map: "உலகளாவிய அபாய வரைபடம்"
            }
        },
        voice: {
            placeholder: "குரல் அல்லது கட்டளை மூலம் தேடவும்...",
            listening: "அமைப்பு கேட்கிறது...",
            captured: "பேச்சு கைப்பற்றப்பட்டது",
            error: "பேச்சு பிழை"
        }
    }
};

export type Language = 'en' | 'ta';
