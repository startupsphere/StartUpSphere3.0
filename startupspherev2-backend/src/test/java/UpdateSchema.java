import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class UpdateSchema {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
        String user = "postgres.lkhnygiipqvgugaastax";
        String password = "#StartupSphere!2026123#";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            System.out.println("Connected to database");
            try {
                stmt.execute("ALTER TABLE startups ADD COLUMN role VARCHAR(255)");
                System.out.println("Column 'role' added successfully.");
            } catch (Exception e) {
                System.out.println("Column might already exist or error occurred: " + e.getMessage());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
