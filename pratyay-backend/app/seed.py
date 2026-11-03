"""Demo data for a fictional company. No real confidential material."""
from sqlalchemy.orm import Session

from . import models as m


def seed_if_empty(db: Session) -> None:
    if db.query(m.Rule).first() or db.query(m.Evidence).first():
        return

    db.add_all([
        m.Rule(name="Prohibited Absolute Claims", category="Promotional Claims", rule_type="Restricted Term",
               summary="Absolute promises such as guaranteed results or miracle cures are not allowed.",
               description="Claims of guaranteed or absolute outcomes cannot be substantiated and must be removed "
                           "or reworded before publication.",
               target_term="guaranteed returns / miracle cure / 100% safe", status="Active",
               notes="Based on ASCI Code Chapter 1 (Honest Representation)."),
        m.Rule(name="Restricted Plan Wording", category="Terminology", rule_type="Restricted Term",
               summary="'Unlimited' may only be used with the fair-use note and legal approval.",
               description="Plans are not unlimited. Use the approved plan names instead.",
               target_term="unlimited / lifetime", status="Active"),
        m.Rule(name="Customer-Facing Terminology: Affordable", category="Terminology", rule_type="Preferred Term",
               summary="Say 'affordable', not 'cheap'.", description="Brand voice avoids 'cheap'.",
               target_term="cheap", replacement_term="affordable", status="Active"),
        m.Rule(name="Customer-Facing Terminology: Top-up", category="Terminology", rule_type="Preferred Term",
               summary="Say 'top-up', not 'recharge'.", description="Use 'top-up' in all customer copy.",
               target_term="recharge", replacement_term="top-up", status="Active"),
        m.Rule(name="Promotional Terms Disclaimer", category="Required Wording", rule_type="Required Text",
               summary="Promotional copy (offers, discounts, prices) must state that T&C apply.",
               description="All promotional copy must include the T&C line.",
               target_term="T&C apply", status="Active"),
        m.Rule(name="Brand Voice", category="Tone and Voice", rule_type="General Rule",
               summary="Warm, confident and plain-spoken. Avoid hype and pressure tactics.",
               description="Avoid slang, shouting in capitals, and false urgency or scarcity such as "
                           "'Hurry, only 2 left!'.", status="Active"),
        m.Rule(name="Pricing Presentation", category="Brand Facts", rule_type="General Rule",
               summary="Prices are always shown inclusive of taxes.",
               description="Never promise a price beyond the offer period.", status="Active"),
    ])

    db.add_all([
        m.Evidence(claim_name="India's fastest network", approved_statement="India's fastest network",
                   evidence_description="Third-party speed report, ref SP-2025-11.",
                   source_reference="Speed report 2025", evidence_status="Expired Evidence",
                   valid_from="2025-04-01", expiry_date="2026-03-31"),
        m.Evidence(claim_name="50 million customers", approved_statement="Trusted by 50 million customers",
                   evidence_description="Annual report FY26, page 4.", source_reference="Annual report FY26",
                   evidence_status="Evidence Available", valid_from="2026-04-01", expiry_date="2027-06-30"),
        m.Evidence(claim_name="5G in 200 cities", approved_statement="5G available in 200 cities",
                   evidence_description="Network coverage register, September 2026.",
                   source_reference="Coverage register Sept 2026", evidence_status="Evidence Available",
                   valid_from="2026-09-01", expiry_date="2027-03-31"),
        m.Evidence(claim_name="Carbon neutral operations", approved_statement="Carbon neutral operations",
                   evidence_description="Internal audit complete; external verification pending.",
                   source_reference="ESG audit draft", evidence_status="Needs Review"),
    ])
    db.commit()
