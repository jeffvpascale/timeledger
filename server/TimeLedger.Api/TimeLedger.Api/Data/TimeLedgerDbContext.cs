using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Data
{
	public class TimeLedgerDbContext : DbContext
	{
		public TimeLedgerDbContext(DbContextOptions<TimeLedgerDbContext> options) : base(options)
		{
		}

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Project>()
				.HasOne(p => p.Client)
				.WithMany(c => c.Projects)
				.OnDelete(DeleteBehavior.Restrict);

			modelBuilder.Entity<TimeEntry>()
				.HasOne(t => t.Project)
				.WithMany(p => p.TimeEntries)
				.OnDelete(DeleteBehavior.Restrict);

			modelBuilder.Entity<Client>()
				.HasIndex(c => c.Name)
				.IsUnique();
		}

		public DbSet<Client> Clients { get; set; }
		public DbSet<Project> Projects { get; set; }
		public DbSet<TimeEntry> TimeEntries { get; set; }
	}
}

