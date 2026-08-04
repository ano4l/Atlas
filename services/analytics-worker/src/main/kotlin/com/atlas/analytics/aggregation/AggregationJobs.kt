package com.atlas.analytics.aggregation

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

// Scheduled aggregation jobs producing the venue/advertiser outputs in
// techspec.md §8.6 (searches, routes completed, zone footfall, dwell,
// impressions, positioning-confidence/correction rates).
//
// Job shape (daily/hourly aggregation over a staged event table) mirrors the
// batch_ingestion_dag / warehouse_transform_dag pattern from
// hoangsonww/End-to-End-Data-Pipeline and hammad42/Cloud-Data-Processing-Pipelines,
// scaled down deliberately: Spring @Scheduled + PostgreSQL rollups instead of
// Airflow/Spark/Kafka, per the "avoid premature operational complexity" rule
// in techspec.md §3. Revisit only once measured event volume requires it.
@Component
class AggregationJobs {

    private val logger = LoggerFactory.getLogger(AggregationJobs::class.java)

    /** Hourly: search demand, route completion, zone movement/dwell rollups. */
    @Scheduled(cron = "0 0 * * * *")
    fun runHourlyRollups() {
        logger.info("Running hourly analytics rollups (search demand, route completion, zone movement)")
        // TODO(Epic G): aggregate from the raw event table into per-venue,
        // per-hour rollup tables per techspec.md §8.6.
    }

    /** Daily: advertising delivery and positioning-quality summaries. */
    @Scheduled(cron = "0 0 2 * * *")
    fun runDailyRollups() {
        logger.info("Running daily analytics rollups (advertising delivery, positioning quality)")
        // TODO(Epic G): aggregate impressions/clicks and confidence/correction
        // rates into daily reporting tables consumed by apps/venue-dashboard.
    }
}
