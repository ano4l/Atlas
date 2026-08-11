package com.atlas.platform.events

import com.atlas.platform.repo.RawEventRepository
import com.atlas.platform.repo.VenueRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import java.time.OffsetDateTime
import java.util.UUID

class EventIngestionServiceTest {
    private val rawEventRepository = mock(RawEventRepository::class.java)
    private val venueRepository = mock(VenueRepository::class.java)
    private val service = EventIngestionService(rawEventRepository, venueRepository)

    @Test
    fun `duplicate event ids are acknowledged without a second insert`() {
        val eventId = UUID.randomUUID()
        val event = IncomingEvent(
            eventId = eventId,
            eventName = "route_started",
            occurredAt = OffsetDateTime.now(),
        )
        `when`(rawEventRepository.existsById(eventId)).thenReturn(false, true)

        val result = service.ingestBatch(listOf(event, event))

        assertEquals(BatchIngestResult(accepted = 1, duplicates = 1, quarantined = 0), result)
        verify(rawEventRepository, times(1)).save(org.mockito.ArgumentMatchers.any())
    }

    @Test
    fun `unsupported schemas are quarantined`() {
        val eventId = UUID.randomUUID()
        val event = IncomingEvent(
            eventId = eventId,
            eventName = "route_started",
            schemaVersion = 99,
            occurredAt = OffsetDateTime.now(),
        )
        `when`(rawEventRepository.existsById(eventId)).thenReturn(false)

        val result = service.ingestBatch(listOf(event))

        assertEquals(BatchIngestResult(accepted = 0, duplicates = 0, quarantined = 1), result)
    }
}
