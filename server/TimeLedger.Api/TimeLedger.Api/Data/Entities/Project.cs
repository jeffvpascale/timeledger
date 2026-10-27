using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Entities
{
	public class Project
	{
		public int Id { get; set; }

		[Required]
		public required string Name { get; set; } = string.Empty;

		public string? Description { get; set; }

		[Range(0.00, double.MaxValue)]
		public decimal Rate { get; set; }

		public bool IsArchived { get; set; }

		public int ClientId { get; set; }

		public Client Client { get; set; } = null!;

		public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
	}
}
