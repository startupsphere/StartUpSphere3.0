package com.startupsphere.capstone.configs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseSequenceFixer {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSequenceFixer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void synchronizeDatabaseSequences() {
        logger.info("Initializing PostgreSQL database primary key sequence synchronization...");
        
        List<String> tables = List.of(
            "users", "startups", "bookmarks", "likes", "notifications",
            "recents", "views", "investor", "report", "stakeholder",
            "startup_stakeholders", "startup_drafts"
        );

        for (String table : tables) {
            try {
                // Determine ID column name ('id', 'report_id', or 'investor_id')
                String idColumn = "id";
                if ("report".equalsIgnoreCase(table)) idColumn = "report_id";
                if ("investor".equalsIgnoreCase(table)) idColumn = "investor_id";

                // Query to setval sequence to max ID in table
                String query = String.format(
                    "DO $$ " +
                    "DECLARE " +
                    "   seq_name text; " +
                    "   max_id bigint; " +
                    "BEGIN " +
                    "   seq_name := pg_get_serial_sequence('%s', '%s'); " +
                    "   IF seq_name IS NOT NULL THEN " +
                    "       EXECUTE 'SELECT COALESCE(MAX(%s), 1) FROM %s' INTO max_id; " +
                    "       PERFORM setval(seq_name, max_id, true); " +
                    "   END IF; " +
                    "END $$;",
                    table, idColumn, idColumn, table
                );

                jdbcTemplate.execute(query);
                logger.debug("Successfully synchronized sequence for table: {}", table);
            } catch (Exception e) {
                // Log debug for non-Postgres DBs or missing optional tables
                logger.debug("Sequence synchronization note for table {}: {}", table, e.getMessage());
            }
        }
        logger.info("Database primary key sequences successfully synchronized.");
    }
}
